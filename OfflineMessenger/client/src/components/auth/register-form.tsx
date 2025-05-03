import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

const registerSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters"),
  password: z.string()
    .min(6, "Password must be at least 6 characters"),
  displayName: z.string()
    .min(1, "Full name is required")
    .max(100, "Full name must be less than 100 characters"),
  role: z.enum(["student", "teacher", "staff"], {
    errorMap: () => ({ message: "Please select a role" }),
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const { registerMutation } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "student"
    }
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" htmlFor="displayName">
          Nom complet
        </label>
        <input
          id="displayName"
          type="text"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.displayName ? "border-destructive" : "border-gray-300"
          }`}
          {...register("displayName")}
        />
        {errors.displayName && (
          <p className="mt-1 text-sm text-destructive">{errors.displayName.message}</p>
        )}
      </div>
      
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
      
      <div className="mb-4">
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
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1" htmlFor="role">
          Rôle
        </label>
        <select
          id="role"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.role ? "border-destructive" : "border-gray-300"
          }`}
          {...register("role")}
        >
          <option value="student">Élève</option>
          <option value="teacher">Professeur</option>
          <option value="staff">Personnel</option>
        </select>
        {errors.role && (
          <p className="mt-1 text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={registerMutation.isPending}
        className="w-full bg-primary hover:bg-primary/80 text-white font-medium py-2 px-4 rounded-lg transition duration-200 disabled:opacity-70"
      >
        {registerMutation.isPending ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Inscription...
          </div>
        ) : (
          "S'inscrire"
        )}
      </button>
    </form>
  );
}
