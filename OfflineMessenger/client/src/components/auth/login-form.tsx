import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { loginMutation } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" htmlFor="username">
          Identifiant
        </label>
        <input
          id="username"
          type="text"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.username ? "border-destructive" : "border-gray-300"
          }`}
          {...register("username")}
        />
        {errors.username && (
          <p className="mt-1 text-sm text-destructive">{errors.username.message}</p>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.password ? "border-destructive" : "border-gray-300"
          }`}
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full bg-primary hover:bg-primary/80 text-white font-medium py-2 px-4 rounded-lg transition duration-200 disabled:opacity-70"
      >
        {loginMutation.isPending ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Connexion...
          </div>
        ) : (
          "Se connecter"
        )}
      </button>
    </form>
  );
}
