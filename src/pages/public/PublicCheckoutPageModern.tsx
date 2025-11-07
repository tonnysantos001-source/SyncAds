/**
 * PublicCheckoutPage - Checkout Público Moderno SyncAds
 * 
 * Checkout responsivo com:
 * - 100+ opções de personalização
 * - Validações em tempo real
 * - Animações Framer Motion
 * - PIX e Cartão modernos
 * - Steps fluidos
 * 
 * @version 2.0
 * @date 2025-01-07
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CreditCard,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Lock,
  Package,
  Truck,
  ChevronRight,
  ChevronLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Sparkles,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { checkoutApi } from "@/lib/api/checkoutApi";
import { CreditCardForm, CardData } from "@/components/checkout/CreditCardForm";
import { PixPayment } from "@/components/checkout/PixPayment";
import { applyTheme } from "@/config/defaultCheckoutTheme";
import { cn } from "@/lib/utils";
import {
  validateName,
  validateEmail,
  validatePhone,
  validateNameDebounced,
  validateEmailDebounced,
  validatePhoneDebounced,
  formatPhone,
  capitalizeWords,
  type NameValidationResult,
  type EmailValidationResult,
  type ValidationResult,
} from "@/lib/utils/validationUtils";

// Continuará...
