import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  MessageSquare,
  TrendingUp,
  Sparkles,
  Zap,
  Target,
  Eye,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUploadField } from "@/components/checkout/ImageUploadField";
import chatService from "@/lib/api/chatService";

const FEMALE_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80",
];

const MALE_AVATARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80",
];

const LOCAL_REVIEW_TEMPLATES = [
  "Comprei o [Produto] e achei maravilhoso! Chegou super rápido e a qualidade é sensacional. Recomendadíssimo! 😍✨",
  "O [Produto] superou todas as minhas expectativas! A entrega foi super ágil e o produto é de excelente qualidade. Nota 10/10!",
  "Estou usando o [Produto] há alguns dias e estou amando o resultado. Podem comprar sem medo!",
  "Melhor compra que fiz este ano. O [Produto] é prático, de ótima qualidade e funciona perfeitamente.",
  "Chegou tudo certinho e muito bem embalado. O [Produto] realmente cumpre o que promete. Vendedor de parabéns! 👏👏",
  "O custo-benefício do [Produto] é sensacional. Já indiquei para várias amigas!",
  "Simplesmente apaixonada por esse [Produto]! A qualidade é incrível e chegou antes do prazo.",
  "Comprei o [Produto] e gostei muito. Excelente atendimento e envio ultra rápido.",
  "Fiquei com receio no início, mas o [Produto] é fantástico e de extrema utilidade. Muito satisfeito!",
  "Produto de alta qualidade e acabamento impecável. Com certeza comprarei mais vezes."
];

const FEMALE_NAMES = [
  "Mariana Costa", "Camila Rodrigues", "Juliana Souza", "Amanda Lima", "Larissa Ferreira",
  "Fernanda Santos", "Patricia Gomes", "Aline Martins", "Beatriz Rocha", "Gabriela Silva",
  "Letícia Oliveira", "Bruna Albuquerque", "Vanessa Dias", "Carolina Mendes", "Renata Carvalho"
];

const MALE_NAMES = [
  "Carlos Eduardo", "Lucas Silva", "Thiago Oliveira", "Felipe Santos", "Gustavo Costa",
  "Rodrigo Souza", "Bruno Lima", "Rafael Ferreira", "Daniel Alves", "André Ribeiro",
  "Mateus Cardoso", "Diego Neves", "Marcelo Vieira", "Leonardo Souza", "Gabriel Martins"
];

const generateLocally = (productName: string, quantity: number, gender: "female" | "male" | "both") => {
  const generated = [];
  const templates = [...LOCAL_REVIEW_TEMPLATES];
  const femaleNames = [...FEMALE_NAMES];
  const maleNames = [...MALE_NAMES];
  
  // Shuffle to randomize selection
  templates.sort(() => Math.random() - 0.5);
  femaleNames.sort(() => Math.random() - 0.5);
  maleNames.sort(() => Math.random() - 0.5);

  const relativeTimes = [
    "há 5 minutos",
    "há 20 minutos",
    "há 1 hora",
    "há 2 horas",
    "há 5 horas",
    "há 1 dia",
    "há 2 dias",
    "há 3 dias"
  ];

  for (let i = 0; i < quantity; i++) {
    const currentGender = gender === "both" 
      ? (Math.random() > 0.5 ? "female" : "male") 
      : gender;
    
    const nameList = currentGender === "female" ? femaleNames : maleNames;
    const name = nameList[i % nameList.length];

    const avatarList = currentGender === "female" ? FEMALE_AVATARS : MALE_AVATARS;
    const avatar = avatarList[i % avatarList.length];

    const template = templates[i % templates.length];
    const message = template.replace("[Produto]", productName);
    const relativeTime = relativeTimes[Math.floor(Math.random() * relativeTimes.length)];

    generated.push({
      type: "REVIEWS",
      message: message,
      displayDuration: 5,
      isActive: false,
      display: {
        authorName: name,
        rating: 5,
        avatarUrl: avatar,
        relativeTime: relativeTime,
        gender: currentGender
      }
    });
  }

  return generated;
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay?: number;
  subtitle?: string;
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  color,
  delay = 0,
  subtitle,
}: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
        <div
          className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full blur-3xl`}
        />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface SocialProof {
  id: string;
  userId: string;
  type: "RECENT_PURCHASE" | "VISITOR_COUNT" | "REVIEW";
  message: string;
  displayDuration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  display?: {
    authorName?: string;
    rating?: number;
    avatarUrl?: string;
    relativeTime?: string;
  } | null;
}

const SocialProofPage = () => {
  const [socialProofs, setSocialProofs] = useState<SocialProof[]>([]);
  const [filteredProofs, setFilteredProofs] = useState<SocialProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProof, setEditingProof] = useState<SocialProof | null>(null);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    type: "RECENT_PURCHASE" as "RECENT_PURCHASE" | "VISITOR_COUNT" | "REVIEW",
    message: "",
    displayDuration: 5,
    isActive: true,
    authorName: "",
    rating: 5,
    avatarUrl: "",
    relativeTime: "Há 2 horas",
    gender: "female" as "female" | "male",
  });

  const handleGenderChange = (gender: "female" | "male") => {
    const list = gender === "female" ? FEMALE_AVATARS : MALE_AVATARS;
    const randomAvatar = list[Math.floor(Math.random() * list.length)];
    setFormData({
      ...formData,
      gender,
      avatarUrl: randomAvatar,
    });
  };

  const [isGenDialogOpen, setIsGenDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genFormData, setGenFormData] = useState({
    productName: "",
    quantity: 5,
    gender: "both" as "female" | "male" | "both",
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genFormData.productName.trim()) {
      toast({
        title: "Nome do produto obrigatório",
        description: "Por favor, insira o nome do produto para gerar depoimentos.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      let proofsToInsert: any[] = [];

      try {
        const prompt = `Gere ${genFormData.quantity} depoimentos de clientes (avaliações) em português do Brasil para o produto "${genFormData.productName}".
O gênero dos autores deve ser ${genFormData.gender === 'both' ? 'misto (masculino e feminino)' : genFormData.gender === 'female' ? 'feminino' : 'masculino'}.
Retorne APENAS um array JSON válido, sem explicações, markdown ou blocos de código.
Cada objeto do array deve ter exatamente este formato:
[
  {
    "authorName": "Nome do Autor",
    "message": "Mensagem curta, realista e natural sobre o produto",
    "rating": 5,
    "relativeTime": "há 2 horas",
    "gender": "female" // ou "male"
  }
]
Os depoimentos devem ser curtos, realistas, naturais e informais (típicos de redes sociais e e-commerce).`;

        console.log("🤖 [AI Generator] Enviando prompt para IA...");
        const uuid = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const aiResponse = await chatService.sendMessage(prompt, uuid);
        console.log("🤖 [AI Generator] Resposta recebida da IA:", aiResponse);
        
        let jsonStr = aiResponse.trim();
        if (jsonStr.includes("```")) {
          const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match) jsonStr = match[1];
        }

        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          proofsToInsert = parsed.map((item) => {
            const currentGender = item.gender === 'male' || item.gender === 'female' ? item.gender : 'female';
            const avatars = currentGender === 'female' ? FEMALE_AVATARS : MALE_AVATARS;
            const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
            
            return {
              userId: user.id,
              type: "REVIEWS",
              message: item.message || `Ótimo produto, super indico!`,
              displayDuration: 5,
              isActive: false,
              display: {
                authorName: item.authorName || (currentGender === 'female' ? "Cliente" : "Cliente"),
                rating: Number(item.rating || 5),
                avatarUrl: item.avatarUrl || randomAvatar,
                relativeTime: item.relativeTime || "há 2 horas",
                gender: currentGender
              }
            };
          });
          console.log(`🤖 [AI Generator] Sucesso! ${proofsToInsert.length} depoimentos gerados via IA.`);
        }
      } catch (aiError) {
        console.warn("⚠️ [AI Generator] Falha ao gerar com IA, usando gerador local de fallback:", aiError);
      }

      if (proofsToInsert.length === 0) {
        console.log("📝 [AI Generator] Usando gerador de backup local...");
        const localProofs = generateLocally(genFormData.productName, genFormData.quantity, genFormData.gender);
        proofsToInsert = localProofs.map(p => ({ ...p, userId: user.id }));
        console.log(`📝 [AI Generator] Sucesso! ${proofsToInsert.length} depoimentos gerados localmente.`);
      }

      const { error: insertError } = await supabase
        .from("SocialProof")
        .insert(proofsToInsert);

      if (insertError) throw insertError;

      toast({
        title: "Geração concluída!",
        description: `${proofsToInsert.length} depoimentos foram gerados como inativos com sucesso.`,
      });

      setIsGenDialogOpen(false);
      setGenFormData({
        productName: "",
        quantity: 5,
        gender: "both",
      });
      loadSocialProofs();

    } catch (err: any) {
      console.error("❌ [AI Generator] Erro geral na geração:", err);
      toast({
        title: "Erro na geração",
        description: err.message || "Não foi possível gerar os depoimentos.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    loadSocialProofs();
  }, [user?.id]);

  useEffect(() => {
    filterProofs();
  }, [searchTerm, socialProofs]);

  const loadSocialProofs = async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("SocialProof")
        .select("*")
        .eq("userId", user.id)
        .order("createdAt", { ascending: false });

      if (error) throw error;

      const mappedData = (data || []).map((p) => ({
        ...p,
        type: p.type === 'REVIEWS' ? 'REVIEW' : p.type === 'LIVE_VIEWS' ? 'VISITOR_COUNT' : p.type,
      }));

      if (mappedData.length === 0) {
        // Seed database with examples!
        const examples = [
          {
            userId: user.id,
            type: "REVIEWS",
            message: "Gente, comprem sem medo! Chegou super rápido e o produto é perfeito, amei real 😍✨",
            displayDuration: 5,
            isActive: false,
            display: {
              authorName: "Mariana Costa",
              rating: 5,
              avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
              relativeTime: "há 2 horas",
              gender: "female"
            }
          },
          {
            userId: user.id,
            type: "REVIEWS",
            message: "Chegou tudo certinho, vendedor super atencioso. Nota 10/10!!",
            displayDuration: 5,
            isActive: false,
            display: {
              authorName: "Carlos Eduardo",
              rating: 5,
              avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
              relativeTime: "há 1 dia",
              gender: "male"
            }
          },
          {
            userId: user.id,
            type: "REVIEWS",
            message: "Melhor compra que fiz esse ano, super recomendo pra todo mundo!",
            displayDuration: 5,
            isActive: false,
            display: {
              authorName: "Camila Rodrigues",
              rating: 5,
              avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80",
              relativeTime: "há 3 dias",
              gender: "female"
            }
          }
        ];

        const { error: seedError } = await supabase
          .from("SocialProof")
          .insert(examples);

        if (seedError) {
          console.error("Erro ao inserir exemplos:", seedError);
        } else {
          // Re-load proofs after seeding
          const { data: seededData } = await supabase
            .from("SocialProof")
            .select("*")
            .eq("userId", user.id)
            .order("createdAt", { ascending: false });
          
          if (seededData) {
            const mappedSeeded = seededData.map((p) => ({
              ...p,
              type: p.type === 'REVIEWS' ? 'REVIEW' : p.type === 'LIVE_VIEWS' ? 'VISITOR_COUNT' : p.type,
            }));
            setSocialProofs(mappedSeeded);
            setFilteredProofs(mappedSeeded);
            return;
          }
        }
      }

      setSocialProofs(mappedData);
      setFilteredProofs(mappedData);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProofs = () => {
    if (!searchTerm) {
      setFilteredProofs(socialProofs);
      return;
    }
    const filtered = socialProofs.filter((p) =>
      p.message.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredProofs(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.id) return;

      const displayData = formData.type === "REVIEW" ? {
        authorName: formData.authorName || "Cliente Anônimo",
        rating: formData.rating || 5,
        avatarUrl: formData.avatarUrl || "",
        relativeTime: formData.relativeTime || "Compra recente",
        gender: formData.gender || "female",
      } : {};

      const submissionData = {
        type: formData.type === 'REVIEW' ? 'REVIEWS' : formData.type === 'VISITOR_COUNT' ? 'LIVE_VIEWS' : formData.type,
        message: formData.message,
        displayDuration: formData.displayDuration,
        isActive: formData.isActive,
        display: displayData,
      };

      if (editingProof) {
        const { error } = await supabase
          .from("SocialProof")
          .update({ ...submissionData, updatedAt: new Date().toISOString() })
          .eq("id", editingProof.id);
        if (error) throw error;
        toast({ title: "Prova social atualizada!" });
      } else {
        const { error } = await supabase
          .from("SocialProof")
          .insert({ ...submissionData, userId: user.id });
        if (error) throw error;
        toast({
          title: "Prova social criada!",
          description: "A notificação está pronta para exibição.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadSocialProofs();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta prova social?")) return;
    try {
      const { error } = await supabase
        .from("SocialProof")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Prova social deletada" });
      loadSocialProofs();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (proof: any) => {
    setEditingProof(proof);
    setFormData({
      type: proof.type,
      message: proof.message,
      displayDuration: proof.displayDuration,
      isActive: proof.isActive,
      authorName: proof.display?.authorName || "",
      rating: proof.display?.rating || 5,
      avatarUrl: proof.display?.avatarUrl || "",
      relativeTime: proof.display?.relativeTime || "Há 2 horas",
      gender: proof.display?.gender || "female",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProof(null);
    setFormData({
      type: "RECENT_PURCHASE",
      message: "",
      displayDuration: 5,
      isActive: true,
      authorName: "",
      rating: 5,
      avatarUrl: "",
      relativeTime: "Há 2 horas",
      gender: "female",
    });
  };

  const activeProofs = socialProofs.filter((p) => p.isActive).length;

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      RECENT_PURCHASE: "Compra Recente",
      VISITOR_COUNT: "Contador de Visitantes",
      REVIEW: "Avaliação",
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "RECENT_PURCHASE":
        return <TrendingUp className="h-4 w-4" />;
      case "VISITOR_COUNT":
        return <Users className="h-4 w-4" />;
      case "REVIEW":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com animação */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
            Prova Social
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium mt-2">
            Notificações em tempo real para aumentar confiança e conversões
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isGenDialogOpen} onOpenChange={setIsGenDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="shadow-md hover:shadow-lg transition-all border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-900 dark:text-purple-400 dark:hover:bg-purple-950 font-medium"
              >
                <Sparkles className="mr-2 h-5 w-5 text-purple-600" />
                Gerador de Depoimentos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Gerador de Depoimentos com IA
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleGenerate} className="space-y-5 mt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    Nome do Produto *
                  </Label>
                  <Input
                    value={genFormData.productName}
                    onChange={(e) => setGenFormData({ ...genFormData, productName: e.target.value })}
                    placeholder="Ex: Fone Bluetooth JBL"
                    required
                    disabled={isGenerating}
                    className="bg-white/50 dark:bg-gray-800/50"
                  />
                  <p className="text-xs text-gray-500">
                    A inteligência artificial ou o gerador criará opiniões reais específicas sobre este produto.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Quantidade
                    </Label>
                    <select
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                      value={genFormData.quantity}
                      onChange={(e) => setGenFormData({ ...genFormData, quantity: parseInt(e.target.value) })}
                      disabled={isGenerating}
                    >
                      <option value="3">3 Depoimentos</option>
                      <option value="5">5 Depoimentos</option>
                      <option value="8">8 Depoimentos</option>
                      <option value="10">10 Depoimentos</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Gênero do Autor
                    </Label>
                    <select
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                      value={genFormData.gender}
                      onChange={(e: any) => setGenFormData({ ...genFormData, gender: e.target.value })}
                      disabled={isGenerating}
                    >
                      <option value="both">Ambos (Misto)</option>
                      <option value="female">Feminino</option>
                      <option value="male">Masculino</option>
                    </select>
                  </div>
                </div>

                <DialogFooter className="gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsGenDialogOpen(false)}
                    disabled={isGenerating}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 min-w-[140px]"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="mr-2 h-5 w-5" />
                Criar Prova Social
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-none shadow-2xl p-6 overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                {editingProof ? "Editar Prova Social" : "Nova Prova Social"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Switch Toggle de Status Moderno (Estilo iOS) no Topo */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/60 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Zap className={`h-4.5 w-4.5 transition-colors ${formData.isActive ? "text-amber-500 animate-pulse" : "text-gray-400"}`} />
                  <div>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Status da Prova Social</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {formData.isActive ? "Exibindo no checkout em tempo real" : "Desativado / Oculto no checkout"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    formData.isActive ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      formData.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-purple-500" />
                    Tipo *
                  </Label>
                  <select
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-purple-500/50 transition-all text-sm h-9"
                    value={formData.type}
                    onChange={(e: any) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    required
                  >
                    <option value="RECENT_PURCHASE">Compra Recente</option>
                    <option value="VISITOR_COUNT">Contador de Visitantes</option>
                    <option value="REVIEW">Avaliação</option>
                  </select>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                    {formData.type === "RECENT_PURCHASE" && 'Ex: "João de SP comprou..."'}
                    {formData.type === "VISITOR_COUNT" && 'Ex: "23 pessoas visualizando..."'}
                    {formData.type === "REVIEW" && 'Ex: "★★★★★ Produto excelente!"'}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-green-500" />
                    Exibição (seg) *
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.displayDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayDuration: parseInt(e.target.value),
                      })
                    }
                    className="bg-white/50 dark:bg-gray-800/50 text-sm p-2 h-9"
                    required
                  />
                </div>
              </div>

              {formData.type === "REVIEW" && (
                <div className="space-y-3.5 p-3.5 rounded-xl bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-500 dark:text-gray-400">Nome do Autor *</Label>
                      <Input
                        value={formData.authorName}
                        onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                        placeholder="Ex: Maria Silva"
                        required={formData.type === "REVIEW"}
                        className="bg-white dark:bg-gray-800 text-sm p-2 h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-500 dark:text-gray-400">Tempo Relativo</Label>
                      <Input
                        value={formData.relativeTime}
                        onChange={(e) => setFormData({ ...formData, relativeTime: e.target.value })}
                        placeholder="Ex: Há 2 horas"
                        className="bg-white dark:bg-gray-800 text-sm p-2 h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-500 dark:text-gray-400">Avaliação (Estrelas)</Label>
                      <select
                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500/50 transition-all text-xs h-9"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                      >
                        <option value="5">★★★★★ (5 Estrelas)</option>
                        <option value="4">★★★★☆ (4 Estrelas)</option>
                        <option value="3">★★★☆☆ (3 Estrelas)</option>
                        <option value="2">★★☆☆☆ (2 Estrelas)</option>
                        <option value="1">★☆☆☆☆ (1 Estrela)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-500 dark:text-gray-400">Gênero do Autor</Label>
                      <div className="flex gap-2 h-9 items-center">
                        <button
                          type="button"
                          onClick={() => handleGenderChange("female")}
                          className={`flex-1 h-full px-2 text-xs rounded-md border font-medium transition-all ${formData.gender === "female" ? "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 shadow-sm" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                        >
                          Feminino
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenderChange("male")}
                          className={`flex-1 h-full px-2 text-xs rounded-md border font-medium transition-all ${formData.gender === "male" ? "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 shadow-sm" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                        >
                          Masculino
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                  Mensagem *
                </Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Digite a mensagem que será exibida..."
                  rows={2}
                  className="bg-white/50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-sm p-2.5 h-16"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800/60 pt-4 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 h-9 text-xs px-3"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-none shadow-md hover:shadow-lg transition-all duration-300 h-9 text-xs px-4"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  {editingProof ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>

      {/* Métricas com animação */}
      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard
          title="Total de Provas"
          value={socialProofs.length}
          icon={Sparkles}
          color="bg-orange-500"
          delay={0.1}
          subtitle="Notificações criadas"
        />
        <MetricCard
          title="Provas Ativas"
          value={activeProofs}
          icon={Zap}
          color="bg-green-500"
          delay={0.2}
          subtitle="Exibindo no checkout"
        />
        <MetricCard
          title="Impacto"
          value="Alto"
          icon={Target}
          color="bg-red-500"
          delay={0.3}
          subtitle="Aumenta confiança"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3" style={{ display: "none" }}>
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{socialProofs.length}</div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProofs}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 dark:text-gray-400" />
        <Input
          placeholder="Buscar provas sociais..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 backdrop-blur-sm"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Lista de Provas Sociais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredProofs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 mb-4">
                  <MessageSquare className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Nenhuma prova social encontrada
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  {searchTerm
                    ? "Tente ajustar sua busca"
                    : "Comece criando provas sociais para aumentar a confiança dos seus clientes"}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(true);
                    }}
                    size="lg"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira Prova Social
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border border-gray-200 dark:border-gray-800">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Tipo</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProofs.map((proof, index) => (
                      <motion.tr
                        key={proof.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(proof.type)}
                            <span className="text-sm">
                              {getTypeLabel(proof.type)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          {proof.type === "REVIEW" ? (
                            <div className="flex items-center gap-3 py-1">
                              {proof.display?.avatarUrl ? (
                                <img
                                  src={proof.display.avatarUrl}
                                  alt={proof.display.authorName}
                                  className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                  {(proof.display?.authorName || "C").charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="text-xs min-w-0">
                                <div className="font-bold dark:text-gray-200 flex items-center gap-1.5 truncate">
                                  <span>{proof.display?.authorName || "Cliente"}</span>
                                  <span className="text-yellow-500 font-mono">{"★".repeat(proof.display?.rating || 5)}</span>
                                </div>
                                <div className="text-gray-500 truncate max-w-xs">{proof.message}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="truncate block max-w-xs">{proof.message}</span>
                          )}
                        </TableCell>
                        <TableCell>{proof.displayDuration}s</TableCell>
                        <TableCell>
                          <Badge
                            variant={proof.isActive ? "default" : "secondary"}
                            className={
                              proof.isActive
                                ? "bg-green-500 hover:bg-green-600"
                                : ""
                            }
                          >
                            {proof.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(proof)}
                              className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(proof.id)}
                              className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SocialProofPage;

