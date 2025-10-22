import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { validateUsername, validateCPF, validateRG, formatUsername } from "@/lib/validators";
import { toast } from "sonner";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  username: z.string()
    .min(3, "Username deve ter no mínimo 3 caracteres")
    .max(20, "Username deve ter no máximo 20 caracteres")
    .refine((val) => validateUsername(val), {
      message: "Username deve conter apenas letras, números e underscore",
    }),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
  documentType: z.enum(["cpf", "rg"], {
    required_error: "Selecione o tipo de documento",
  }),
  documentNumber: z.string().min(1, "Número do documento é obrigatório"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.documentType === "cpf") {
    return validateCPF(data.documentNumber);
  } else if (data.documentType === "rg") {
    return validateRG(data.documentNumber);
  }
  return true;
}, {
  message: "Documento inválido",
  path: ["documentNumber"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ open, onOpenChange, onSwitchToLogin }: RegisterModalProps) {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      documentType: undefined,
      documentNumber: "",
    },
  });

  // Verificar disponibilidade de username
  useEffect(() => {
    const username = form.watch("username");
    
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    if (!validateUsername(username)) {
      setUsernameAvailable(null);
      return;
    }

    const checkUsername = async () => {
      setCheckingUsername(true);
      const formattedUsername = formatUsername(username);
      
      try {
        const { data, error } = await (supabase as any)
          .from("profiles")
          .select("username")
          .eq("username", formattedUsername)
          .maybeSingle();

        if (error) throw error;
        setUsernameAvailable(!data);
      } catch (error) {
        console.error("Erro ao verificar username:", error);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [form.watch("username")]);

  const onSubmit = async (values: RegisterFormValues) => {
    if (!usernameAvailable) {
      toast.error("Username não disponível");
      return;
    }

    setIsLoading(true);
    
    try {
      // Criar conta com metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: values.name,
            username: formatUsername(values.username),
            document_type: values.documentType,
            document_number: values.documentNumber.replace(/\D/g, ''),
          },
        },
      });

      if (authError) throw authError;

      // Atualizar perfil com os dados adicionais
      if (authData.user) {
        const { error: profileError } = await (supabase as any)
          .from("profiles")
          .update({
            username: formatUsername(values.username),
            document_type: values.documentType,
            document_number: values.documentNumber.replace(/\D/g, ''),
          })
          .eq("user_id", authData.user.id);

        if (profileError) throw profileError;
      }

      toast.success("Conta criada com sucesso!");
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Erro ao criar conta:", error);
      
      if (error.message?.includes("already registered")) {
        toast.error("Este email já está cadastrado");
      } else if (error.message?.includes("Username")) {
        toast.error("Username inválido ou já está em uso");
      } else {
        toast.error("Erro ao criar conta");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Crie sua conta
          </DialogTitle>
          <DialogDescription>
            Comece a criar torneios profissionais hoje
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Seu nome"
                      className="focus:ring-primary focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Usuário</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="@seu_usuario"
                        className="focus:ring-primary focus:border-primary pr-10"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value.startsWith('@') ? value : value);
                        }}
                      />
                      {checkingUsername && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {!checkingUsername && usernameAvailable === true && (
                        <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-emerald-500" />
                      )}
                      {!checkingUsername && usernameAvailable === false && (
                        <XCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                  {usernameAvailable === false && (
                    <p className="text-xs text-destructive">Username já está em uso</p>
                  )}
                  {usernameAvailable === true && (
                    <p className="text-xs text-emerald-500">Username disponível!</p>
                  )}
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      className="focus:ring-primary focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="focus:ring-primary focus:border-primary">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="rg">RG</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={form.watch("documentType") === "cpf" ? "000.000.000-00" : "00.000.000-0"}
                        className="focus:ring-primary focus:border-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••"
                      className="focus:ring-primary focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••"
                      className="focus:ring-primary focus:border-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={isLoading || checkingUsername || usernameAvailable === false}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>
        </Form>
        
        <div className="text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-primary hover:underline font-medium"
          >
            Faça login
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
