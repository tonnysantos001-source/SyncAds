import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { getUserPlanLimits, getDailyUsage } from "@/lib/plans/planLimits";
import { supabase } from "@/lib/supabase";

export const PlanDebugInfo = () => {
  const user = useAuthStore((state) => state.user);
  const [planInfo, setPlanInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPlanInfo = async () => {
      try {
        // Buscar dados do usuário do banco
        const { data: userData } = await supabase
          .from("User")
          .select("id, email, name, currentPlanId")
          .eq("id", user.id)
          .single();

        // Buscar plano atual
        let planData = null;
        if (userData?.currentPlanId) {
          const { data } = await supabase
            .from("PricingPlan")
            .select("*")
            .eq("id", userData.currentPlanId)
            .single();
          planData = data;
        }

        // Buscar limites e uso
        const limits = await getUserPlanLimits(user.id);
        const usage = await getDailyUsage(user.id);

        setPlanInfo({
          user: userData,
          plan: planData,
          limits,
          usage,
        });
      } catch (error) {
        console.error("Erro ao buscar info do plano:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanInfo();
  }, [user]);

  if (!user) return null;
  if (loading) return <div className="p-4">Carregando...</div>;

  return (
    <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          🐛 Debug - Informações do Plano
          <Badge variant="outline">DEV ONLY</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-xs">
          {/* Info do Usuário */}
          <div>
            <h4 className="font-semibold mb-1">👤 Usuário</h4>
            <div className="bg-white dark:bg-gray-900 p-2 rounded border">
              <p><strong>ID:</strong> {planInfo?.user?.id}</p>
              <p><strong>Email:</strong> {planInfo?.user?.email}</p>
              <p><strong>Nome:</strong> {planInfo?.user?.name}</p>
              <p>
                <strong>Plano ID:</strong>{" "}
                {planInfo?.user?.currentPlanId || (
                  <span className="text-red-600 font-bold">❌ SEM PLANO!</span>
                )}
              </p>
            </div>
          </div>

          {/* Info do Plano */}
          <div>
            <h4 className="font-semibold mb-1">📋 Plano Atual</h4>
            {planInfo?.plan ? (
              <div className="bg-white dark:bg-gray-900 p-2 rounded border">
                <p><strong>Nome:</strong> {planInfo.plan.name}</p>
                <p><strong>Slug:</strong> {planInfo.plan.slug}</p>
                <p><strong>Preço:</strong> R$ {planInfo.plan.price}</p>
                <p>
                  <strong>Mensagens IA/dia:</strong>{" "}
                  {planInfo.plan.maxAiMessagesDaily === 0
                    ? "Ilimitado"
                    : planInfo.plan.maxAiMessagesDaily}
                </p>
              </div>
            ) : (
              <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded border border-red-500">
                <p className="text-red-600 font-bold">❌ Nenhum plano encontrado!</p>
              </div>
            )}
          </div>

          {/* Limites */}
          <div>
            <h4 className="font-semibold mb-1">🎯 Limites (via planLimits.ts)</h4>
            {planInfo?.limits ? (
              <div className="bg-white dark:bg-gray-900 p-2 rounded border">
                <p>
                  <strong>Mensagens IA/dia:</strong>{" "}
                  {planInfo.limits.maxAiMessagesDaily === 0
                    ? "Ilimitado ♾️"
                    : planInfo.limits.maxAiMessagesDaily}
                </p>
                <p>
                  <strong>Imagens IA/dia:</strong>{" "}
                  {planInfo.limits.maxAiImagesDaily === 0
                    ? "Ilimitado ♾️"
                    : planInfo.limits.maxAiImagesDaily}
                </p>
              </div>
            ) : (
              <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded border border-red-500">
                <p className="text-red-600 font-bold">
                  ❌ Erro ao buscar limites!
                </p>
              </div>
            )}
          </div>

          {/* Uso Diário */}
          <div>
            <h4 className="font-semibold mb-1">📊 Uso Hoje</h4>
            {planInfo?.usage ? (
              <div className="bg-white dark:bg-gray-900 p-2 rounded border">
                <p>
                  <strong>Mensagens usadas:</strong>{" "}
                  {planInfo.usage.aiMessagesUsed}
                </p>
                <p>
                  <strong>Imagens usadas:</strong> {planInfo.usage.aiImagesUsed}
                </p>
                <p>
                  <strong>Data:</strong> {planInfo.usage.date}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded border border-yellow-500">
                <p className="text-yellow-600">⚠️ Nenhum uso registrado hoje</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

