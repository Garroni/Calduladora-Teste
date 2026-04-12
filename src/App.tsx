/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity,
  ArrowRight,
  Calculator, 
  User, 
  Target, 
  Dumbbell, 
  Droplets, 
  Utensils, 
  ChevronRight, 
  Download, 
  MessageCircle, 
  Info,
  CheckCircle2,
  Apple,
  Zap,
  Brain,
  Sparkles,
  Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import confetti from 'canvas-confetti';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { cn } from './lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Constants & Types ---

type Goal = 'loss' | 'maintenance' | 'gain';
type Sex = 'M' | 'F';
type BodyType = 'ectomorph' | 'mesomorph' | 'endomorph';
type Comorbidity = 'diabetes' | 'hypertension' | 'cholesterol' | 'hypothyroidism' | 'gastritis';

interface ComorbidityInfo {
  id: Comorbidity;
  label: string;
  icon: string;
}

const COMORBIDITIES: ComorbidityInfo[] = [
  { id: 'diabetes', label: 'Diabetes', icon: '🩸' },
  { id: 'hypertension', label: 'Pressão Alta', icon: '❤️' },
  { id: 'cholesterol', label: 'Colesterol Alto', icon: '🧪' },
  { id: 'hypothyroidism', label: 'Hipotireoidismo', icon: '🦋' },
  { id: 'gastritis', label: 'Gastrite/Refluxo', icon: '🔥' },
];

interface Sport {
  id: string;
  label: string;
  multiplier: number;
  icon: string;
}

const SPORTS: Sport[] = [
  { id: 'running', label: 'Corrida', multiplier: 0.15, icon: '🏃' },
  { id: 'martial_arts', label: 'Artes Marciais', multiplier: 0.18, icon: '🥋' },
  { id: 'weight_training', label: 'Musculação', multiplier: 0.12, icon: '💪' },
  { id: 'weightlifting', label: 'Levantamento', multiplier: 0.14, icon: '⚡' },
  { id: 'football', label: 'Futebol', multiplier: 0.16, icon: '⚽' },
  { id: 'basketball', label: 'Basquete', multiplier: 0.17, icon: '🏀' },
  { id: 'cycling', label: 'Ciclismo', multiplier: 0.15, icon: '🚴' },
  { id: 'swimming', label: 'Natação', multiplier: 0.16, icon: '🏊' },
  { id: 'yoga', label: 'Yoga', multiplier: 0.05, icon: '🧘' },
  { id: 'crossfit', label: 'CrossFit', multiplier: 0.20, icon: '🔥' },
];

const BODY_TYPES: Record<BodyType, { label: string; carbs: number; protein: number; fats: number; description: string; details: string[] }> = {
  mesomorph: { 
    label: 'Mesomorfo', 
    carbs: 45, 
    protein: 30, 
    fats: 25, 
    description: 'O biotipo "atlético". Possui uma estrutura óssea média e facilidade tanto para ganhar músculos quanto para queimar gordura.',
    details: [
      'Ombros largos e cintura estreita',
      'Facilidade em ganhar massa muscular',
      'Metabolismo eficiente',
      'Estrutura óssea média'
    ]
  },
  ectomorph: { 
    label: 'Ectomorfo', 
    carbs: 55, 
    protein: 25, 
    fats: 20, 
    description: 'O biotipo "magro". Caracterizado por uma estrutura óssea fina, membros longos e metabolismo extremamente acelerado.',
    details: [
      'Membros longos e articulações pequenas',
      'Dificuldade em ganhar peso/massa',
      'Metabolismo muito acelerado',
      'Baixo percentual de gordura natural'
    ]
  },
  endomorph: { 
    label: 'Endomorfo', 
    carbs: 35, 
    protein: 35, 
    fats: 30, 
    description: 'O biotipo "robusto". Tem facilidade em ganhar peso e massa muscular, mas maior dificuldade em perder gordura devido ao metabolismo mais lento.',
    details: [
      'Cintura e quadris mais largos',
      'Maior facilidade em acumular gordura',
      'Metabolismo mais lento',
      'Estrutura óssea larga e forte'
    ]
  },
};

const GOALS: Record<Goal, { label: string; icon: string; color: string }> = {
  loss: { label: 'Perder Peso', icon: '⬇️', color: 'text-rose-400' },
  maintenance: { label: 'Manter', icon: '➡️', color: 'text-blue-400' },
  gain: { label: 'Ganhar Massa', icon: '⬆️', color: 'text-emerald-400' },
};

// --- Components ---

const Card = ({ children, className, title, icon: Icon, defaultExpanded = true, collapsible = false }: { children: React.ReactNode; className?: string; title?: string; icon?: any; defaultExpanded?: boolean; collapsible?: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "bg-white/70 backdrop-blur-xl border border-[#E9D5CA] rounded-[2.5rem] p-6 md:p-8 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1",
        className
      )}
    >
      {title && (
        <div 
          className={cn(
            "flex items-center justify-between mb-6",
            collapsible && "cursor-pointer select-none"
          )}
          onClick={() => collapsible && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              >
                <Icon className="w-5 h-5 text-[#1B4332]" />
              </motion.div>
            )}
            <h2 className="text-2xl font-serif font-medium text-[#4A4A4A] tracking-tight">{title}</h2>
          </div>
          {collapsible && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronRight className="w-5 h-5 text-[#A67C52] rotate-90" />
            </motion.div>
          )}
        </div>
      )}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const StepIndicator = ({ formData }: { formData: any }) => {
  const steps = [
    { id: 1, label: 'Perfil', active: !!(formData.age && formData.height && formData.weight), icon: User },
    { id: 2, label: 'Biotipo', active: !!formData.bodyType, icon: Target },
    { id: 3, label: 'Saúde', active: formData.selectedComorbidities.length > 0, icon: Activity },
    { id: 4, label: 'Atividade', active: formData.selectedSports.length > 0, icon: Dumbbell },
  ];

  return (
    <div className="flex items-center justify-between w-full mb-12 px-4">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-3 relative z-10">
            <motion.div 
              animate={{ 
                scale: step.active ? [1, 1.05, 1] : 1,
                backgroundColor: step.active ? '#1B4332' : '#FFFFFF',
                borderColor: step.active ? '#1B4332' : '#E9D5CA'
              }}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center border transition-colors duration-500 shadow-sm",
                step.active ? "text-white" : "text-[#A67C52]"
              )}
            >
              <motion.div
                animate={step.active ? { 
                  rotate: [0, 10, -10, 0],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <step.icon className="w-6 h-6" />
              </motion.div>
            </motion.div>
            <span className={cn(
              "text-[11px] font-bold uppercase tracking-[0.15em] transition-colors duration-500 font-serif",
              step.active ? "text-[#1B4332]" : "text-[#A67C52]/50"
            )}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className="flex-1 h-[1px] bg-[#E9D5CA] mx-4 -mt-8 relative overflow-hidden">
              <motion.div 
                initial={{ left: '-100%' }}
                animate={{ left: step.active ? '0%' : '-100%' }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-[#1B4332]"
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const BackgroundVideo = React.memo(() => {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden bg-[#FDF8F3] [will-change:transform]">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1920&q=80"
        className="w-full h-full object-cover opacity-15 transition-opacity duration-1000"
        onCanPlay={(e) => (e.currentTarget.style.opacity = "0.15")}
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-fresh-vegetables-and-fruits-on-a-table-40546-large.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-[#FDF8F3]/90 via-[#FDF8F3]/40 to-[#FDF8F3]/95" />
    </div>
  );
});

export default function App() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    height: '',
    weight: '',
    sex: 'M' as Sex,
    goal: 'maintenance' as Goal,
    selectedSports: [] as string[],
    bodyType: '' as BodyType | '',
    selectedComorbidities: [] as Comorbidity[],
  });

  const [results, setResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<{ title: string; uri: string }[]>([]);

  const calculate = () => {
    const { age, height, weight, sex, goal, selectedSports, bodyType, selectedComorbidities } = formData;
    if (!age || !height || !weight || !bodyType) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);

    // Mifflin-St Jeor
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr = sex === 'M' ? bmr + 5 : bmr - 161;

    // Activity Factor
    let activityFactor = 1.2;
    if (selectedSports.length > 0) {
      const sportMultipliers = selectedSports.reduce((sum, id) => {
        const sport = SPORTS.find(s => s.id === id);
        return sum + (sport?.multiplier || 0);
      }, 0);
      activityFactor = 1.375 + Math.min(sportMultipliers, 0.4);
    }

    let tdee = bmr * activityFactor;

    // Goal Adjustment
    if (goal === 'loss') tdee *= 0.85;
    else if (goal === 'gain') tdee *= 1.1;

    const bt = BODY_TYPES[bodyType as BodyType];
    if (!bt) return;
    const proteinGrams = (tdee * (bt.protein / 100)) / 4;
    const carbsGrams = (tdee * (bt.carbs / 100)) / 4;
    const fatsGrams = (tdee * (bt.fats / 100)) / 9;

    let water = w * 35;
    if (selectedSports.length > 0) water += 500 * selectedSports.length;

    const personalizedTips = [];
    
    // Goal-based tips
    if (goal === 'gain') {
      personalizedTips.push("Aumente o consumo de proteínas para pelo menos 2.0g/kg para maximizar a síntese proteica.");
      personalizedTips.push("Foque em um superávit calórico leve e constante para ganhar massa com o mínimo de gordura.");
    } else if (goal === 'loss') {
      personalizedTips.push("Priorize fibras e proteínas em todas as refeições para aumentar a saciedade durante o déficit.");
      personalizedTips.push("Mantenha a ingestão de água alta para auxiliar no metabolismo lipídico e controle de apetite.");
    } else {
      personalizedTips.push("Mantenha a consistência nos horários das refeições para estabilizar os níveis de energia.");
      personalizedTips.push("Foque na qualidade dos micronutrientes para longevidade e performance estável.");
    }

    // BodyType-based tips
    if (bodyType === 'ectomorph') {
      personalizedTips.push("Como ectomorfo, foque em carboidratos complexos para sustentar seu metabolismo acelerado.");
    } else if (bodyType === 'endomorph') {
      personalizedTips.push("Como endomorfo, controle a ingestão de carboidratos e priorize gorduras boas e proteínas.");
    } else if (bodyType === 'mesomorph') {
      personalizedTips.push("Como mesomorfo, você responde bem a uma dieta equilibrada; foque na qualidade dos alimentos.");
    }

    // Comorbidity-based tips
    if (selectedComorbidities.includes('diabetes')) {
      personalizedTips.push("Diabetes: Priorize carboidratos de baixo índice glicêmico e monitore a carga glicêmica das refeições.");
    }
    if (selectedComorbidities.includes('hypertension')) {
      personalizedTips.push("Hipertensão: Reduza o consumo de sódio e aumente a ingestão de potássio através de vegetais.");
    }
    if (selectedComorbidities.includes('cholesterol')) {
      personalizedTips.push("Colesterol: Foque em gorduras monoinsaturadas e fibras solúveis (aveia, leguminosas).");
    }
    if (selectedComorbidities.includes('hypothyroidism')) {
      personalizedTips.push("Hipotireoidismo: Garanta a ingestão adequada de iodo e selênio, e monitore a densidade calórica.");
    }
    if (selectedComorbidities.includes('gastritis')) {
      personalizedTips.push("Gastrite: Evite refeições volumosas e alimentos irritantes (cafeína, pimenta, excesso de gordura).");
    }

    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      protein: Math.round(proteinGrams),
      carbs: Math.round(carbsGrams),
      fats: Math.round(fatsGrams),
      water: (water / 1000).toFixed(1),
      tips: personalizedTips,
      macros: [
        { name: 'Proteína', value: Math.round(proteinGrams * 4), color: '#1B4332' },
        { name: 'Carbos', value: Math.round(carbsGrams * 4), color: '#E9D5CA' },
        { name: 'Gorduras', value: Math.round(fatsGrams * 9), color: '#A67C52' },
      ]
    });

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1B4332', '#E9D5CA', '#A67C52']
    });
  };

  const runDeepAnalysis = async () => {
    if (!results) return;
    setIsAnalyzing(true);
    setDeepAnalysis(null);
    setGroundingSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Realize uma busca científica rigorosa e atualizada no PubMed, Google Scholar e bases de dados de nutrição esportiva para fundamentar uma análise estratégica para o seguinte perfil:
        Nome: ${formData.name}
        Idade: ${formData.age}
        Peso: ${formData.weight}kg
        Altura: ${formData.height}cm
        Sexo: ${formData.sex}
        Objetivo: ${GOALS[formData.goal].label}
        Biotipo: ${BODY_TYPES[formData.bodyType as BodyType]?.label || 'Não informado'}
        Comorbidades: ${formData.selectedComorbidities.length > 0 ? formData.selectedComorbidities.map(c => COMORBIDITIES.find(info => info.id === c)?.label).join(', ') : 'Nenhuma'}
        Esportes: ${formData.selectedSports.join(', ')}
        
        Resultados Calculados:
        TMB: ${results.bmr} kcal
        GET: ${results.tdee} kcal
        Macros: P:${results.protein}g, C:${results.carbs}g, G:${results.fats}g
        
        Sua tarefa:
        1. Busque evidências científicas RECENTES e RIGOROSAS (priorizando PubMed, Google Scholar e Cochrane) sobre estratégias nutricionais e de treinamento específicas para este biotipo, objetivo e COMORBIDADES selecionadas.
        2. Para as comorbidades (${formData.selectedComorbidities.join(', ')}), forneça recomendações baseadas em diretrizes clínicas internacionais (ex: ADA para diabetes, AHA para hipertensão).
        3. Forneça uma análise técnica profunda, citando a lógica metabólica e fisiológica por trás das recomendações.
        3. Sugira suplementação com base em estudos clínicos (mencione se houver evidência de nível A).
        4. Mantenha um tom de autoridade científica, sendo direto e técnico, porém acessível.
        5. Liste as referências encontradas no final ou utilize o grounding para que eu possa exibi-las.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          tools: [{ googleSearch: {} }]
        }
      });

      setDeepAnalysis(response.text || "Não foi possível gerar a análise no momento.");
      
      // Extract grounding sources
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const sources = chunks
          .filter(chunk => chunk.web)
          .map(chunk => ({
            title: chunk.web?.title || 'Fonte Científica',
            uri: chunk.web?.uri || '#'
          }));
        setGroundingSources(sources);
      }
    } catch (error) {
      console.error("Erro na análise profunda:", error);
      setDeepAnalysis("Erro ao conectar com o motor de inteligência. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = () => {
    if (!results) return;
    const content = `
SIMULADOR DE METABOLISMO - PLANO PERSONALIZADO
-------------------------------
Nome: ${formData.name || 'Usuário'}
Objetivo: ${GOALS[formData.goal].label}
TMB: ${results.bmr} kcal
GET: ${results.tdee} kcal

MACROS DIÁRIOS:
Proteína: ${results.protein}g
Carboidratos: ${results.carbs}g
Gorduras: ${results.fats}g

HIDRATAÇÃO:
Água: ${results.water}L/dia

ANÁLISE PROFUNDA:
${deepAnalysis || 'Nenhuma análise profunda gerada.'}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meu-plano-simulador-metabolismo.txt';
    a.click();
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-[#1B4332]/20 relative">
      <BackgroundVideo />

      {/* Header */}
      <header className="relative overflow-hidden pt-20 pb-16 px-4 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-[#E9D5CA]/30 blur-[100px] -z-10 rounded-full" />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E9D5CA] text-[#1B4332] text-[10px] font-bold uppercase tracking-widest mb-8 shadow-sm">
            <Zap className="w-3 h-3" /> Ciência & Estética
          </div>
          <h1 className="text-6xl md:text-8xl font-serif font-medium tracking-tighter text-[#4A4A4A] mb-6 leading-[0.9]">
            Simulador de <span className="italic text-[#1B4332] font-light">Metabolismo</span>
          </h1>
          <p className="text-[#A67C52] text-xl font-serif italic max-w-2xl mx-auto opacity-70 tracking-wide">
            Sua beleza. Sua saúde. Nossa paixão.
          </p>
        </motion.div>
      </header>

      <main className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-10">
          <StepIndicator formData={formData} />
          
          <Card title="Informações Pessoais" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A67C52] ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  placeholder="Ex: Maria Silva"
                  className="w-full bg-white border border-[#E9D5CA] rounded-2xl px-5 py-4 focus:ring-1 focus:ring-[#1B4332] focus:border-[#1B4332] outline-none transition-all duration-300 text-[#4A4A4A] placeholder-[#E9D5CA] font-sans text-sm"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A67C52] ml-1">Gênero</label>
                <div className="flex gap-3">
                  {(['M', 'F'] as Sex[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setFormData({...formData, sex: s})}
                      className={cn(
                        "flex-1 py-4 rounded-2xl border font-serif text-lg transition-all duration-300 hover:bg-[#FDF8F3] active:scale-95",
                        formData.sex === s 
                          ? "bg-[#1B4332] border-[#1B4332] text-white shadow-md shadow-[#1B4332]/20" 
                          : "bg-white border-[#E9D5CA] text-[#A67C52]"
                      )}
                    >
                      {s === 'M' ? 'Masculino' : 'Feminino'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A67C52] ml-1">Idade</label>
                <input 
                  type="number" 
                  className="w-full bg-white border border-[#E9D5CA] rounded-2xl px-5 py-4 focus:ring-1 focus:ring-[#1B4332] focus:border-[#1B4332] outline-none transition-all duration-300 text-[#4A4A4A] font-sans text-sm"
                  value={formData.age}
                  onChange={e => setFormData({...formData, age: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#A67C52] ml-1">Altura (cm)</label>
                  <input 
                    type="number" 
                    className="w-full bg-white border border-[#E9D5CA] rounded-2xl px-5 py-4 focus:ring-1 focus:ring-[#1B4332] focus:border-[#1B4332] outline-none transition-all duration-300 text-[#4A4A4A] font-sans text-sm"
                    value={formData.height}
                    onChange={e => setFormData({...formData, height: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#A67C52] ml-1">Peso (kg)</label>
                  <input 
                    type="number" 
                    className="w-full bg-white border border-[#E9D5CA] rounded-2xl px-5 py-4 focus:ring-1 focus:ring-[#1B4332] focus:border-[#1B4332] outline-none transition-all duration-300 text-[#4A4A4A] font-sans text-sm"
                    value={formData.weight}
                    onChange={e => setFormData({...formData, weight: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Objetivo & Biotipo" icon={Target}>
            <div className="space-y-10">
              <div className="space-y-5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A67C52] ml-1">Seu Objetivo</label>
                <div className="grid grid-cols-3 gap-4">
                  {(Object.keys(GOALS) as Goal[]).map(g => (
                    <button
                      key={g}
                      onClick={() => setFormData({...formData, goal: g})}
                      className={cn(
                        "flex flex-col items-center gap-3 p-5 rounded-3xl border transition-all duration-300 hover:shadow-md active:scale-95",
                        formData.goal === g 
                          ? "bg-[#1B4332]/10 border-[#1B4332] text-[#1B4332]" 
                          : "bg-white border-[#E9D5CA] text-[#A67C52]"
                      )}
                    >
                      <span className="text-3xl">{GOALS[g].icon}</span>
                      <span className="text-[11px] font-bold uppercase tracking-widest">{GOALS[g].label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-1 ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#A67C52]">Biotipo Corporal</label>
                  <p className="text-[11px] text-[#A67C52]/60 font-serif italic">Selecione a estrutura que melhor descreve seu corpo naturalmente.</p>
                </div>

                {/* Tabs Selection */}
                <div className="relative p-1.5 bg-[#FDF8F3] rounded-2xl border border-[#E9D5CA] flex items-center gap-1">
                  {(Object.keys(BODY_TYPES) as BodyType[]).map(bt => (
                    <button
                      key={bt}
                      onClick={() => setFormData({...formData, bodyType: bt})}
                      className={cn(
                        "relative flex-1 flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-xl transition-colors duration-500",
                        formData.bodyType === bt ? "text-white" : "text-[#A67C52] hover:bg-[#1B4332]/5"
                      )}
                    >
                      {formData.bodyType === bt && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-[#1B4332] rounded-xl shadow-lg shadow-[#1B4332]/20"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      
                      <div className={cn(
                        "relative z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300",
                        formData.bodyType === bt ? "bg-white/20" : "bg-[#1B4332]/5"
                      )}>
                        {bt === 'ectomorph' && <Zap className="w-4 h-4" />}
                        {bt === 'mesomorph' && <Dumbbell className="w-4 h-4" />}
                        {bt === 'endomorph' && <Activity className="w-4 h-4" />}
                      </div>
                      <span className="relative z-10 text-[10px] font-bold uppercase tracking-[0.15em]">{BODY_TYPES[bt].label}</span>
                    </button>
                  ))}
                </div>

                {/* Detailed Content Area */}
                <AnimatePresence mode="wait">
                  {formData.bodyType && (
                    <motion.div
                      key={formData.bodyType}
                      initial={{ opacity: 0, scale: 0.99, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.99, y: -10 }}
                      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                      className="bg-white border border-[#E9D5CA] rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden"
                    >
                      {/* Decorative background element */}
                      <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#1B4332]/5 rounded-full blur-3xl" />
                      
                      <div className="relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                          <div className="lg:col-span-7 space-y-8">
                            <div>
                              <div className="flex items-center gap-3 mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B4332] bg-[#1B4332]/10 px-4 py-1.5 rounded-full">Perfil Biológico</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-[#E9D5CA] to-transparent" />
                              </div>
                              <h3 className="font-serif text-4xl font-medium text-[#1B4332] mb-4 tracking-tight">
                                {BODY_TYPES[formData.bodyType as BodyType]?.label}
                              </h3>
                              <p className="text-base text-[#4A4A4A] font-serif italic leading-relaxed opacity-80">
                                {BODY_TYPES[formData.bodyType as BodyType]?.description}
                              </p>
                            </div>

                            <div className="space-y-5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[10px] text-[#A67C52] font-bold uppercase tracking-widest">
                                  <Sparkles className="w-3.5 h-3.5" /> Estratégia de Macronutrientes
                                </div>
                                <span className="text-[9px] text-[#A67C52]/60 font-serif italic">Baseado no metabolismo basal</span>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-4">
                                {[
                                  { label: 'Carboidratos', value: BODY_TYPES[formData.bodyType as BodyType]?.carbs, color: 'bg-[#E9D5CA]', icon: '🍞' },
                                  { label: 'Proteínas', value: BODY_TYPES[formData.bodyType as BodyType]?.protein, color: 'bg-[#1B4332]', icon: '🍗' },
                                  { label: 'Gorduras', value: BODY_TYPES[formData.bodyType as BodyType]?.fats, color: 'bg-[#A67C52]', icon: '🥑' }
                                ].map((macro, i) => (
                                  <div key={i} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">{macro.icon}</span>
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#4A4A4A]">{macro.label}</span>
                                      </div>
                                      <span className="text-xs font-mono font-medium text-[#1B4332]">{macro.value}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-[#FDF8F3] rounded-full overflow-hidden border border-[#E9D5CA]/30">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${macro.value}%` }}
                                        transition={{ duration: 1.2, delay: 0.3 + i * 0.1, ease: "circOut" }}
                                        className={cn("h-full rounded-full shadow-inner", macro.color)}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="lg:col-span-5">
                            <div className="h-full bg-[#FDF8F3]/70 p-8 rounded-[2rem] border border-[#E9D5CA]/50 flex flex-col">
                              <div className="flex items-center gap-3 mb-8">
                                <div className="w-8 h-8 rounded-full bg-[#1B4332] flex items-center justify-center text-white shadow-md">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-[#1B4332]">Características Chave</p>
                              </div>
                              
                              <div className="space-y-5 flex-1">
                                {BODY_TYPES[formData.bodyType as BodyType]?.details.map((detail, i) => (
                                  <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: 15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                    className="flex items-start gap-4 group"
                                  >
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#A67C52] group-hover:scale-150 group-hover:bg-[#1B4332] transition-all duration-300" />
                                    <span className="text-sm text-[#4A4A4A] font-serif italic leading-relaxed group-hover:text-[#1B4332] transition-colors duration-300">{detail}</span>
                                  </motion.div>
                                ))}
                              </div>

                              <div className="mt-8 pt-6 border-t border-[#E9D5CA]/40">
                                <div className="flex items-center gap-2 text-[#A67C52]/60">
                                  <Activity className="w-3 h-3" />
                                  <p className="text-[10px] font-serif italic leading-tight">
                                    Nota: A maioria dos indivíduos possui características mistas entre os biotipos.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>

          <Card title="Saúde & Comorbidades" icon={Activity}>
            <div className="space-y-6">
              <div className="flex flex-col gap-1 ml-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A67C52]">Condições de Saúde</label>
                <p className="text-[11px] text-[#A67C52]/60 font-serif italic">Selecione se você possui alguma condição que requer atenção nutricional especial.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {COMORBIDITIES.map(condition => (
                  <button
                    key={condition.id}
                    onClick={() => {
                      const exists = formData.selectedComorbidities.includes(condition.id);
                      setFormData({
                        ...formData,
                        selectedComorbidities: exists 
                          ? formData.selectedComorbidities.filter(id => id !== condition.id)
                          : [...formData.selectedComorbidities, condition.id]
                      });
                    }}
                    className={cn(
                      "flex flex-col items-center gap-3 p-5 rounded-3xl border transition-all duration-300 hover:shadow-md active:scale-95",
                      formData.selectedComorbidities.includes(condition.id)
                        ? "bg-[#1B4332]/10 border-[#1B4332] text-[#1B4332]" 
                        : "bg-white border-[#E9D5CA] text-[#A67C52]"
                    )}
                  >
                    <span className="text-3xl">{condition.icon}</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-center">{condition.label}</span>
                  </button>
                ))}
              </div>
              {formData.selectedComorbidities.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-[#1B4332]/5 rounded-2xl border border-[#1B4332]/10 flex gap-3 items-start"
                >
                  <Info className="w-4 h-4 text-[#1B4332] mt-0.5 shrink-0" />
                  <p className="text-[11px] text-[#1B4332] font-serif italic leading-relaxed">
                    Nossa IA realizará uma busca no **PubMed** e em diretrizes clínicas para adaptar as recomendações de macros e suplementação às suas condições de saúde.
                  </p>
                </motion.div>
              )}
            </div>
          </Card>

          <Card title="Estilo de Vida" icon={Dumbbell}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {SPORTS.map(sport => (
                <button
                  key={sport.id}
                  onClick={() => {
                    const exists = formData.selectedSports.includes(sport.id);
                    setFormData({
                      ...formData,
                      selectedSports: exists 
                        ? formData.selectedSports.filter(id => id !== sport.id)
                        : [...formData.selectedSports, sport.id]
                    });
                  }}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-3xl border transition-all duration-300 hover:shadow-md active:scale-95",
                    formData.selectedSports.includes(sport.id)
                      ? "bg-[#1B4332]/10 border-[#1B4332] text-[#1B4332]" 
                      : "bg-white border-[#E9D5CA] text-[#A67C52]"
                  )}
                >
                  <span className="text-2xl">{sport.icon}</span>
                  <span className="text-[10px] font-bold text-center leading-tight uppercase tracking-widest">{sport.label}</span>
                </button>
              ))}
            </div>
          </Card>

          <button 
            onClick={calculate}
            className="w-full py-6 bg-[#1B4332] hover:bg-[#143629] text-white font-serif font-medium text-2xl rounded-[2rem] shadow-xl shadow-[#1B4332]/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 tracking-tight group"
          >
            <Calculator className="w-6 h-6 group-hover:rotate-12 transition-transform" /> CALCULAR MINHA DIETA
          </button>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-5 space-y-10">
          <AnimatePresence mode="wait">
            {!results ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/40 border border-[#E9D5CA] rounded-[3rem] border-dashed"
              >
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm">
                  <Calculator className="w-10 h-10 text-[#E9D5CA]" />
                </div>
                <h3 className="text-2xl font-serif text-[#4A4A4A] mb-3 italic">Aguardando sua jornada</h3>
                <p className="text-[#A67C52] text-sm opacity-60 leading-relaxed">
                  Preencha os dados ao lado para desbloquear seu protocolo estético e nutricional exclusivo.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <Card className="bg-[#1B4332]/5 border-[#1B4332]/20 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-6">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1B4332] animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-8 relative z-10">
                    <div className="text-center p-8 bg-white/60 rounded-[2.5rem] border border-[#E9D5CA]/50">
                      <p className="text-[10px] font-bold text-[#A67C52] uppercase tracking-widest mb-3">Basal</p>
                      <p className="text-5xl font-serif font-medium text-[#4A4A4A] leading-none tracking-tighter">{results.bmr}</p>
                      <p className="text-[10px] text-[#A67C52]/60 mt-3 italic font-serif">kcal/dia</p>
                    </div>
                    <div className="text-center p-8 bg-[#1B4332]/10 rounded-[2.5rem] border border-[#1B4332]/20">
                      <p className="text-[10px] font-bold text-[#1B4332] uppercase tracking-widest mb-3">Recomendado</p>
                      <p className="text-5xl font-serif font-medium text-[#4A4A4A] leading-none tracking-tighter">{results.tdee}</p>
                      <p className="text-[10px] text-[#1B4332]/60 mt-3 italic font-serif">kcal/dia</p>
                    </div>
                  </div>
                </Card>

                {formData.selectedComorbidities.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-[#A67C52]/5 border border-[#A67C52]/20 rounded-[2.5rem] flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-[#A67C52]" />
                      <h4 className="text-[10px] font-bold text-[#A67C52] uppercase tracking-widest">Fatores de Saúde Considerados</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.selectedComorbidities.map(id => {
                        const info = COMORBIDITIES.find(c => c.id === id);
                        return (
                          <span key={id} className="px-4 py-2 bg-white border border-[#E9D5CA] rounded-full text-[11px] font-serif italic text-[#4A4A4A] shadow-sm flex items-center gap-2">
                            <span>{info?.icon}</span> {info?.label}
                          </span>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                <Card title="Equilíbrio de Macros" className="bg-white/50" collapsible defaultExpanded={true}>
                  <div className="h-80 w-full -mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={results.macros}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={105}
                          paddingAngle={10}
                          dataKey="value"
                          stroke="none"
                        >
                          {results.macros.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E9D5CA', borderRadius: '20px', color: '#4A4A4A', fontSize: '12px', fontFamily: 'serif' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div className="text-center p-5 rounded-3xl bg-[#1B4332]/5 border border-[#1B4332]/10">
                      <p className="text-[10px] font-bold text-[#1B4332] uppercase tracking-widest mb-2">Proteína</p>
                      <p className="text-3xl font-serif text-[#4A4A4A] tracking-tighter">{results.protein}g</p>
                    </div>
                    <div className="text-center p-5 rounded-3xl bg-[#E9D5CA]/10 border border-[#E9D5CA]/20">
                      <p className="text-[10px] font-bold text-[#A67C52] uppercase tracking-widest mb-2">Carbo</p>
                      <p className="text-3xl font-serif text-[#4A4A4A] tracking-tighter">{results.carbs}g</p>
                    </div>
                    <div className="text-center p-5 rounded-3xl bg-[#A67C52]/5 border border-[#A67C52]/10">
                      <p className="text-[10px] font-bold text-[#A67C52] uppercase tracking-widest mb-2">Gordura</p>
                      <p className="text-3xl font-serif text-[#4A4A4A] tracking-tighter">{results.fats}g</p>
                    </div>
                  </div>
                </Card>

                <Card title="Protocolo de Bem-Estar" icon={Droplets} className="bg-white/50" collapsible defaultExpanded={false}>
                  <div className="flex items-center justify-between p-6 bg-[#FDF8F3] border border-[#E9D5CA] rounded-[2.5rem] mb-10">
                    <div className="flex items-center gap-5">
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="p-4 bg-white rounded-2xl shadow-sm"
                      >
                        <Droplets className="w-7 h-7 text-[#1B4332]" />
                      </motion.div>
                      <div>
                        <p className="text-[10px] font-bold text-[#A67C52] uppercase tracking-widest mb-1">Hidratação</p>
                        <p className="text-5xl font-serif font-medium text-[#4A4A4A] leading-none tracking-tighter">{results.water}L</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#A67C52]/40 font-bold uppercase tracking-widest">Ideal</p>
                      <p className="text-xl font-serif italic text-[#1B4332]">{Math.round(parseFloat(results.water) * 4)} copos</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {results.tips.map((tip: string, idx: number) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.15 }}
                        key={idx} 
                        className="flex gap-5 p-5 bg-white/40 rounded-3xl border border-[#E9D5CA]/50 hover:bg-white/60 transition-all group"
                      >
                        <CheckCircle2 className="w-5 h-5 text-[#1B4332] shrink-0 mt-1 opacity-60 group-hover:opacity-100 transition-opacity" />
                        <p className="text-base text-[#4A4A4A]/80 leading-relaxed font-serif italic">{tip}</p>
                      </motion.div>
                    ))}
                  </div>
                </Card>

                {/* Deep Analysis Section */}
                <Card title="Análise Profunda (IA)" icon={Brain} className="bg-[#1B4332]/5 border-[#1B4332]/20" collapsible defaultExpanded={false}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="px-2 py-0.5 bg-[#1B4332]/10 rounded-md text-[8px] font-bold text-[#1B4332] uppercase tracking-widest border border-[#1B4332]/20">
                      PubMed Verified
                    </div>
                    <div className="px-2 py-0.5 bg-[#A67C52]/10 rounded-md text-[8px] font-bold text-[#A67C52] uppercase tracking-widest border border-[#A67C52]/20">
                      Google Scholar
                    </div>
                  </div>
                  <div className="space-y-6">
                    {!deepAnalysis && !isAnalyzing && (
                      <div className="text-center py-6">
                        <p className="text-[#A67C52] text-sm italic mb-6">
                          Deseja uma análise estratégica avançada do seu metabolismo e biotipo?
                        </p>
                        <button 
                          onClick={runDeepAnalysis}
                          className="inline-flex items-center gap-3 px-8 py-4 bg-[#1B4332] text-white rounded-2xl font-serif hover:bg-[#143629] transition-all shadow-lg active:scale-95"
                        >
                          <Sparkles className="w-5 h-5" /> Iniciar Análise Profunda
                        </button>
                      </div>
                    )}

                    {isAnalyzing && (
                      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                        <Loader2 className="w-10 h-10 text-[#1B4332] animate-spin" />
                        <p className="text-[#1B4332] font-serif italic animate-pulse">
                          O Metabolism Intelligence está consultando o PubMed e Google Scholar...
                        </p>
                      </div>
                    )}

                    {deepAnalysis && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="prose prose-stone max-w-none"
                      >
                        <div className="bg-white/60 p-6 rounded-3xl border border-[#E9D5CA] text-[#4A4A4A] font-serif italic leading-relaxed whitespace-pre-wrap text-sm">
                          {deepAnalysis}
                        </div>

                        {groundingSources.length > 0 && (
                          <div className="mt-6 space-y-3">
                            <p className="text-[10px] font-bold text-[#1B4332] uppercase tracking-widest ml-2">Fontes Científicas & Referências</p>
                            <div className="flex flex-wrap gap-2">
                              {groundingSources.slice(0, 5).map((source, idx) => (
                                <a 
                                  key={idx}
                                  href={source.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/40 border border-[#E9D5CA] rounded-full text-[10px] text-[#A67C52] hover:bg-[#1B4332]/5 transition-colors"
                                >
                                  <Info className="w-3 h-3" />
                                  {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-6 flex justify-end">
                          <button 
                            onClick={runDeepAnalysis}
                            className="text-[10px] uppercase tracking-widest text-[#1B4332] font-bold hover:underline"
                          >
                            Refazer Análise Científica
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-5 pt-6">
                  <button 
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-3 py-6 bg-white hover:bg-[#FDF8F3] text-[#A67C52] font-serif italic text-base rounded-[2rem] transition-all border border-[#E9D5CA] shadow-sm group"
                  >
                    <Download className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" /> 
                    Exportar Protocolo (.TXT)
                  </button>
                  <a 
                    href={`https://wa.me/?text=Acabei%20de%20gerar%20meu%20plano%20no%20Simulador%20de%20Metabolismo!%20Minha%20meta%20é%20${results.tdee}%20kcal/dia.%20Confira%20o%20seu%20também!`}
                    target="_blank"
                    className="flex items-center justify-center gap-3 py-6 bg-[#1B4332] hover:bg-[#143629] text-white font-serif font-medium text-lg rounded-[2rem] transition-all shadow-xl shadow-[#1B4332]/20 group"
                  >
                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                    Consulte nossos planos e dietas
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Final CTA Section */}
      <section className="max-w-4xl mx-auto px-4 mt-32 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-[#1B4332] rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 blur-[60px] rounded-full -ml-24 -mb-24" />
          
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-10 backdrop-blur-sm border border-white/20"
          >
            <Apple className="w-10 h-10 text-white" />
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-serif mb-8 leading-tight">
            Pronto para <span className="italic opacity-80">transformar</span> seu corpo?
          </h2>
          <p className="text-white/70 text-lg md:text-xl font-serif italic mb-12 max-w-2xl mx-auto">
            Não deixe para amanhã a mudança que você pode começar hoje. Nossos especialistas estão prontos para criar o protocolo perfeito para você.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <a 
              href="#"
              className="px-10 py-6 bg-white text-[#1B4332] font-serif font-medium text-xl rounded-full hover:bg-[#FDF8F3] transition-all shadow-lg active:scale-95"
            >
              Começar Agora
            </a>
            <a 
              href="#"
              className="px-10 py-6 bg-transparent border border-white/30 text-white font-serif font-medium text-xl rounded-full hover:bg-white/10 transition-all active:scale-95"
            >
              Ver Depoimentos
            </a>
          </div>
        </motion.div>
      </section>

      <footer className="max-w-6xl mx-auto px-4 mt-24 text-center">
        <div className="p-10 bg-white/40 border border-[#E9D5CA] rounded-[3rem]">
          <p className="text-[#A67C52] text-sm mb-6 font-serif italic opacity-60">
            Simulador de Metabolismo — Excelência em Nutrição Estética e Performance.
          </p>
          <div className="flex justify-center gap-8 text-[#E9D5CA]">
            <span className="text-[10px] font-mono tracking-widest uppercase">v3.0.0</span>
            <span className="text-[10px] font-mono tracking-widest uppercase">Mifflin-St Jeor Formula</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
