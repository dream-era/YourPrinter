"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  businessRegisterSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  otpSchema,
  verifyOtpSchema,
  type LoginInput,
  type RegisterInput,
  type BusinessRegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type OtpInput,
  type VerifyOtpInput,
} from "./types";

export async function loginAction(data: LoginInput) {
  const validation = loginSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }


  const supabase = await createClient();
  let signInError;

  if (data.email) {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    signInError = error;
  } else if (data.phone) {
    // Note: Supabase sign in with phone requires OTP generally, but if configured with password:
    const { error } = await supabase.auth.signInWithPassword({
      phone: data.phone,
      password: data.password,
    });
    signInError = error;
  }

  if (signInError) {
    return { error: signInError.message };
  }

  return { success: true };
}

export async function registerAction(data: RegisterInput) {
  const validation = registerSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }


  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        phone: data.phone || "",
        role: data.role,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (authData.user) {
    try {
      const { getServiceRoleClient } = await import("@/lib/supabase/admin");
      const serviceRole = getServiceRoleClient();
      await serviceRole.from("profiles").insert({
        id: authData.user.id,
        role: data.role,
        full_name: data.fullName,
        phone: data.phone || "",
      });
    } catch (err: any) {
      console.error("Profile creation error:", err);
      return { error: `Profile setup failed: ${err.message || 'Unknown error'}. (If SUPABASE_SERVICE_ROLE_KEY is set, make sure you redeployed on Vercel)` };
    }
  }

  return { success: true, requireEmailVerification: !authData.session };
}

export async function registerBusinessAction(data: BusinessRegisterInput) {
  const validation = businessRegisterSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }


  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    phone: data.phone,
    options: {
      data: {
        business_name: data.businessName,
        full_name: data.ownerName,
        city: data.city,
        role: data.role,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (authData.user) {
    try {
      const { getServiceRoleClient } = await import("@/lib/supabase/admin");
      const serviceRole = getServiceRoleClient();
      await serviceRole.from("profiles").insert({
        id: authData.user.id,
        role: data.role,
        full_name: data.ownerName,
        phone: data.phone || "",
      });

      await serviceRole.from("shops").insert({
        owner_id: authData.user.id,
        name: data.businessName,
        slug: data.businessName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        address: data.city,
        latitude: 0,
        longitude: 0,
      });
    } catch (err: any) {
      console.error("Profile/Shop creation error:", err);
      return { error: `Profile setup failed: ${err.message || 'Unknown error'}. (If SUPABASE_SERVICE_ROLE_KEY is set, make sure you redeployed on Vercel)` };
    }
  }

  return { success: true, requireEmailVerification: !authData.session };
}

export async function sendOtpAction(data: OtpInput) {
  const validation = otpSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }


  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: data.phone,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function verifyOtpAction(data: VerifyOtpInput) {
  const validation = verifyOtpSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }


  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone: data.phone,
    token: data.token,
    type: "sms",
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

export async function forgotPasswordAction(data: ForgotPasswordInput) {
  const validation = forgotPasswordSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function resetPasswordAction(data: ResetPasswordInput) {
  const validation = resetPasswordSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: data.password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
