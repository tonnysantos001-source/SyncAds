import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import { LucideIcon, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// FeatureCard Component
interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}

export const FeatureCard = ({
  icon: Icon,
  title,
  description,
  gradient,
  delay = 0,
}: FeatureCardProps) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}
    >
      <Card className="h-full border-2 hover:border-pink-200 dark:hover:border-pink-800 transition-all hover:shadow-xl group">
        <CardHeader>
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// PricingCard Component
interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonLink: string;
  popular?: boolean;
  delay?: number;
}

export const PricingCard = ({
  name,
  price,
  period = "",
  description,
  features,
  buttonText,
  buttonLink,
  popular = false,
  delay = 0,
}: PricingCardProps) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}
      className="relative"
    >
      {popular && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-1 text-sm font-bold shadow-lg">
            <Crown className="h-4 w-4 mr-1 inline" />
            Mais Popular
          </Badge>
        </div>
      )}
      <Card
        className={`h-full ${
          popular
            ? "border-4 border-pink-500 shadow-2xl shadow-pink-500/20 scale-105"
            : "border-2 hover:border-gray-300 dark:hover:border-gray-700"
        } transition-all hover:shadow-xl`}
      >
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-2xl font-black mb-2">{name}</CardTitle>
          <CardDescription className="text-sm mb-4">
            {description}
          </CardDescription>
          <div className="flex items-end justify-center gap-1">
            <span
              className={`text-5xl font-black ${
                popular
                  ? "bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {price}
            </span>
            {period && (
              <span className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                {period}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check
                  className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                    popular ? "text-pink-600" : "text-green-600"
                  }`}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
          <Button
            asChild
            className={`w-full ${
              popular
                ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg"
                : ""
            }`}
            variant={popular ? "default" : "outline"}
            size="lg"
          >
            <Link to={buttonLink}>{buttonText}</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

