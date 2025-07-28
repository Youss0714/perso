import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Mail, 
  Phone, 
  Building, 
  User,
  Camera,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useLocation } from "wouter";

// Schema pour l'inscription utilisateur étendue
const userRegistrationSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  address: z.string().optional(),
  businessType: z.string().optional(),
});

type UserRegistrationData = z.infer<typeof userRegistrationSchema>;

export default function UserRegistration() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);

  const form = useForm<UserRegistrationData>({
    resolver: zodResolver(userRegistrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      company: "",
      position: "",
      address: "",
      businessType: "",
    },
  });

  // Initialiser le formulaire avec les données existantes de l'utilisateur
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: "",
        company: "",
        position: "",
        address: "",
        businessType: "",
      });
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserRegistrationData) => {
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur de mise à jour du profil");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profil complété !",
        description: "Votre profil a été mis à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      // Rediriger vers le tableau de bord
      setTimeout(() => {
        setLocation("/");
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la mise à jour de votre profil.",
        variant: "destructive",
      });
      console.error("Erreur de mise à jour du profil:", error);
    },
  });

  const onSubmit = (data: UserRegistrationData) => {
    updateProfileMutation.mutate(data);
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-96 h-96 bg-white rounded-xl shadow-sm" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Connexion requise</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center mb-4">
              Vous devez être connecté pour compléter votre profil.
            </p>
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="w-full"
            >
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue dans GestionPro !
          </h1>
          <p className="text-gray-600">
            Complétez votre profil pour profiter pleinement de toutes les fonctionnalités
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= i 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {step > i ? <CheckCircle className="w-5 h-5" /> : i}
                </div>
                {i < 3 && (
                  <div className={`
                    w-full h-2 mx-4 rounded-full
                    ${step > i ? 'bg-primary' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Informations personnelles</span>
            <span>Entreprise</span>
            <span>Confirmation</span>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Informations personnelles"}
              {step === 2 && "Informations professionnelles"}
              {step === 3 && "Confirmation"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Étape 1: Informations personnelles */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prénom *</FormLabel>
                            <FormControl>
                              <Input placeholder="Kouamé" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom *</FormLabel>
                            <FormControl>
                              <Input placeholder="Yao" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="07 12 34 56 78" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Cocody Riviera 3, Abidjan"
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-4">
                        Email: <span className="font-medium">{user.email}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Étape 2: Informations professionnelles */}
                {step === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de l'entreprise</FormLabel>
                          <FormControl>
                            <Input placeholder="SARL AKWABA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Poste/Fonction</FormLabel>
                          <FormControl>
                            <Input placeholder="Gérant" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secteur d'activité</FormLabel>
                          <FormControl>
                            <Input placeholder="Commerce général, Restauration, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Étape 3: Confirmation */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                        <h3 className="text-lg font-medium text-green-900">
                          Profil prêt à être complété !
                        </h3>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium text-gray-700">Nom complet:</span>
                            <p className="text-gray-900">
                              {form.watch("firstName")} {form.watch("lastName")}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Email:</span>
                            <p className="text-gray-900">{user.email}</p>
                          </div>
                        </div>
                        
                        {form.watch("company") && (
                          <div>
                            <span className="font-medium text-gray-700">Entreprise:</span>
                            <p className="text-gray-900">{form.watch("company")}</p>
                          </div>
                        )}
                        
                        {form.watch("phone") && (
                          <div>
                            <span className="font-medium text-gray-700">Téléphone:</span>
                            <p className="text-gray-900">{form.watch("phone")}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Fonctionnalités disponibles après completion :
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Gestion complète des clients et produits</li>
                        <li>• Création et envoi de factures professionnelles</li>
                        <li>• Tableau de bord avec analytics en temps réel</li>
                        <li>• Export et sauvegarde de vos données</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={step === 1}
                  >
                    Précédent
                  </Button>

                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={
                        (step === 1 && (!form.watch("firstName") || !form.watch("lastName")))
                      }
                    >
                      Suivant
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {updateProfileMutation.isPending ? "Enregistrement..." : "Terminer"}
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}