// =========================================================================
// MÓDULO DE INTEGRAÇÕES GLOBAL - GERENCIADOR DE PLUGINS (Deno)
// =========================================================================

import {
  IntegrationPluginMetadata,
  IntegrationCapabilities,
  CredentialValidationResult,
} from "../types.ts";

export interface RegistrablePlugin {
  metadata: IntegrationPluginMetadata;
  provider: any; // Implementação concreta (ex: GatewayProvider)
}

export class PluginManager {
  private plugins: Map<string, Map<string, RegistrablePlugin>>;

  constructor() {
    this.plugins = new Map<string, Map<string, RegistrablePlugin>>();
  }

  /**
   * Registra um plugin em memória (Discovery/Loader)
   */
  register(plugin: RegistrablePlugin): void {
    const { slug, version } = plugin.metadata;
    
    if (!this.plugins.has(slug)) {
      this.plugins.set(slug, new Map<string, RegistrablePlugin>());
    }

    const versions = this.plugins.get(slug)!;
    versions.set(version, plugin);

    console.log(
      `[PLUGIN-MANAGER] Registered plugin: ${slug}@${version} (${plugin.metadata.name})`
    );
  }

  /**
   * Carrega um plugin específico por slug e versão
   */
  load(slug: string, version: string): RegistrablePlugin | null {
    const versions = this.plugins.get(slug);
    if (!versions) {
      console.warn(`[PLUGIN-MANAGER] Plugin not found: ${slug}`);
      return null;
    }

    const plugin = versions.get(version);
    if (!plugin) {
      console.warn(`[PLUGIN-MANAGER] Plugin version ${version} not found for ${slug}`);
      return null;
    }

    return plugin;
  }

  /**
   * Resolve a versão apropriada com base em solicitações flexíveis
   */
  resolveVersion(slug: string, versionRange: string): string | null {
    const versions = this.plugins.get(slug);
    if (!versions || versions.size === 0) return null;

    // Se pedir "latest", pega a maior versão alfabeticamente/numericamente
    if (versionRange === "latest") {
      const sortedVersions = Array.from(versions.keys()).sort((a, b) =>
        b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" })
      );
      return sortedVersions[0];
    }

    // Retorna a correspondência exata se existir
    if (versions.has(versionRange)) {
      return versionRange;
    }

    return null;
  }

  /**
   * Simula a instalação de um novo plugin na base de dados
   */
  async install(plugin: RegistrablePlugin, supabaseClient: any): Promise<void> {
    const { name, slug, version, category, logoUrl, description, status, configFields, capabilities } =
      plugin.metadata;

    // 1. Inserir ou atualizar na tabela IntegrationPlugin
    const { data: pluginRecord, error: pluginErr } = await supabaseClient
      .from("IntegrationPlugin")
      .upsert(
        {
          name,
          slug,
          version,
          category,
          logo_url: logoUrl || null,
          description: description || null,
          status,
          config_fields: configFields,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug,version" }
      )
      .select("id")
      .single();

    if (pluginErr) {
      throw new Error(`[PLUGIN-MANAGER] Failed to upsert plugin record: ${pluginErr.message}`);
    }

    // 2. Inserir ou atualizar na tabela IntegrationCapability
    const { error: capErr } = await supabaseClient
      .from("IntegrationCapability")
      .upsert(
        {
          integration_plugin_id: pluginRecord.id,
          capabilities,
        },
        { onConflict: "integration_plugin_id" }
      );

    if (capErr) {
      throw new Error(`[PLUGIN-MANAGER] Failed to upsert capabilities: ${capErr.message}`);
    }

    this.register(plugin);
    console.log(`[PLUGIN-MANAGER] Installed plugin ${slug}@${version} in database successfully.`);
  }

  /**
   * Desinstala um plugin e remove seus registros
   */
  async uninstall(slug: string, version: string, supabaseClient: any): Promise<void> {
    const { error } = await supabaseClient
      .from("IntegrationPlugin")
      .delete()
      .eq("slug", slug)
      .eq("version", version);

    if (error) {
      throw new Error(`[PLUGIN-MANAGER] Failed to delete plugin from DB: ${error.message}`);
    }

    const versions = this.plugins.get(slug);
    if (versions) {
      versions.delete(version);
      if (versions.size === 0) {
        this.plugins.delete(slug);
      }
    }

    console.log(`[PLUGIN-MANAGER] Uninstalled plugin ${slug}@${version} successfully.`);
  }

  /**
   * Executa upgrade de versão de um tenant
   */
  async upgrade(
    userId: string,
    slug: string,
    fromVersion: string,
    toVersion: string,
    supabaseClient: any
  ): Promise<void> {
    // 1. Obter registros dos plugins de origem e destino
    const { data: plugins, error: getErr } = await supabaseClient
      .from("IntegrationPlugin")
      .select("id, version")
      .eq("slug", slug)
      .in("version", [fromVersion, toVersion]);

    if (getErr || !plugins || plugins.length < 2) {
      throw new Error(
        `[PLUGIN-MANAGER] Cannot upgrade. Ensure both versions ${fromVersion} and ${toVersion} are registered.`
      );
    }

    const fromPlugin = plugins.find((p: any) => p.version === fromVersion);
    const toPlugin = plugins.find((p: any) => p.version === toVersion);

    // 2. Atualizar a config do usuário para apontar para o novo plugin
    const { error: updateErr } = await supabaseClient
      .from("IntegrationConfig")
      .update({
        integration_plugin_id: toPlugin.id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("integration_plugin_id", fromPlugin.id);

    if (updateErr) {
      throw new Error(`[PLUGIN-MANAGER] Upgrade transaction failed: ${updateErr.message}`);
    }

    console.log(
      `[PLUGIN-MANAGER] Upgraded tenant ${userId} integration ${slug} from ${fromVersion} to ${toVersion}`
    );
  }

  /**
   * Retorna as capabilities declaradas de um plugin
   */
  capabilities(slug: string, version: string): IntegrationCapabilities | null {
    const plugin = this.load(slug, version);
    return plugin ? plugin.metadata.capabilities : null;
  }

  /**
   * Retorna a lista de todos os plugins registrados
   */
  list(): RegistrablePlugin[] {
    const list: RegistrablePlugin[] = [];
    for (const versions of this.plugins.values()) {
      for (const plugin of versions.values()) {
        list.push(plugin);
      }
    }
    return list;
  }
}
