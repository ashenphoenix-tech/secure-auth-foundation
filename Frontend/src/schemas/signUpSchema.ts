import { z } from "zod";

/** Username: letters, numbers, period only. No other special characters. */
const usernameRegex = /^[a-zA-Z0-9.]*$/;

/** Password: at least one uppercase letter. */
const hasUppercase = /[A-Z]/;

/** Password: at least one special character. */
const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export const signUpSchema = z
  .object({
    username: z
      .string()
      .min(1, "Username is required")
      .regex(usernameRegex, "Username can only contain letters, numbers, and period (.)"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(hasUppercase, "Password must contain at least one uppercase letter")
      .regex(hasSpecialChar, "Password must contain at least one special character (!@#$%^&* etc.)"),
    retypePassword: z.string().min(1, "Please retype your password"),
  })
  .refine((data) => data.password === data.retypePassword, {
    message: "Passwords do not match",
    path: ["retypePassword"],
  });

export type SignUpForm = z.infer<typeof signUpSchema>;

/** Password guidelines shown in tooltips; must match signUpSchema password rules. */
export const PASSWORD_TOOLTIP_LINES = [
  "At least 8 characters",
  "One uppercase letter",
  "One special character (!@#$%^&* etc.)",
] as const;
