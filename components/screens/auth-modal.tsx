"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import type { StudentProfile, Interest } from "@/lib/types";
import { CheckIcon, SparkIcon } from "@/components/ui/icons";
import { useI18n } from "@/components/i18n-provider";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
  onSuccess: (profile: Partial<StudentProfile>) => void;
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  onSuccess,
}: AuthModalProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regGrade, setRegGrade] = useState<StudentProfile["grade"]>("11");
  const [regInterest, setRegInterest] = useState<Interest>("computer-science");
  const [regUnt, setRegUnt] = useState<number>(110);
  const [regCity, setRegCity] = useState("Астана");

  if (!isOpen) return null;

  // Google OAuth via Supabase
  const handleGoogleAuth = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setGoogleLoading(true);

    try {
      const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
      const isLocalhost = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);

      // A PKCE OAuth flow must start and finish on the same origin. When the
      // app is opened locally, move the user to the published app first.
      if (isLocalhost && configuredSiteUrl && configuredSiteUrl !== window.location.origin) {
        const productionLoginUrl = new URL(configuredSiteUrl);
        productionLoginUrl.searchParams.set("auth", "google");
        window.location.assign(productionLoginUrl.toString());
        return;
      }

      const redirectUrl = configuredSiteUrl || (typeof window !== "undefined" ? window.location.origin : undefined);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw error;
      }
      // Browser will redirect to Google accounts login
    } catch (err: any) {
      setGoogleLoading(false);
      console.error("Google Auth error:", err);
      // Helpful fallback if Google provider isn't enabled in Supabase project dashboard yet
      setErrorMsg(
        err.message?.includes("provider is not enabled")
          ? t("auth.googleDisabled")
          : t("auth.googleError", { message: err.message || t("auth.tryAgain") })
      );
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!loginEmail.trim()) {
      setErrorMsg(t("auth.errorEmail"));
      return;
    }
    if (!loginPassword || loginPassword.length < 6) {
      setErrorMsg(t("auth.errorPassword"));
      return;
    }

    setLoading(true);
    try {
      // 1. Supabase Auth signIn
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error) throw error;
      if (!data.user || !data.session) throw new Error(t("auth.errorSession"));

      // Extract user metadata or construct profile
      const derivedName = data?.user?.user_metadata?.name || loginEmail.split("@")[0] || "Абитуриент";
      const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

      const userProfile: Partial<StudentProfile> = {
        name: data?.user?.user_metadata?.name || formattedName,
      };

      setSuccessMsg(t("auth.successLogin"));
      setTimeout(() => {
        setLoading(false);
        onSuccess(userProfile);
        onClose();
      }, 700);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || t("auth.loginError"));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!regName.trim()) {
      setErrorMsg(t("auth.errorName"));
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setErrorMsg(t("auth.errorEmailInvalid"));
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg(t("auth.errorPassword"));
      return;
    }

    setLoading(true);
    try {
      // 1. Supabase Auth signup with user metadata
      const { data, error } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_SITE_URL ||
            (typeof window !== "undefined" ? window.location.origin : undefined),
          data: {
            name: regName.trim(),
            grade: regGrade,
            interest: regInterest,
            unt: regUnt,
            city: regCity,
          },
        },
      });

      if (error) throw error;

      const newProfile: Partial<StudentProfile> = {
        name: regName.trim(),
        grade: regGrade,
        interest: regInterest,
        interests: [regInterest],
        unt: regUnt,
        homeCity: regCity,
      };

      if (!data.session || !data.user) {
        setLoading(false);
        setSuccessMsg(t("auth.confirmEmail"));
        setMode("login");
        return;
      }

      setSuccessMsg(t("auth.successCreated"));
      setTimeout(() => {
        setLoading(false);
        onSuccess(newProfile);
        onClose();
      }, 800);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || t("auth.registerError"));
    }
  };

  return createPortal(
    <div
      className="auth-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(4, 9, 21, 0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeIn 0.25s ease forwards",
      }}
    >
      <div
        className="auth-modal-card"
        style={{
          background: "#FFFFFF",
          borderRadius: "28px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(4, 9, 21, 0.08)",
          overflow: "hidden",
          position: "relative",
          animation: "modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={t("auth.close")}
          style={{
            position: "absolute",
            top: "18px",
            right: "18px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#F4F5F7",
            border: "none",
            fontSize: "18px",
            color: "#6a798b",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#E5E7EB";
            e.currentTarget.style.color = "#040915";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#F4F5F7";
            e.currentTarget.style.color = "#6a798b";
          }}
        >
          ✕
        </button>

        {/* Modal Top Header */}
        <div
          style={{
            padding: "32px 32px 20px",
            textAlign: "center",
            borderBottom: "1px solid #F0F2F5",
            background: "linear-gradient(180deg, #FAFAFC 0%, #FFFFFF 100%)",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "28px", fontWeight: 900, color: "#040915", letterSpacing: "-0.5px" }}>
              UniFlow<span style={{ color: "#FE7505" }}>.</span>
            </span>
          </div>
          <p style={{ margin: "2px 0 0", color: "#6a798b", fontSize: "13.5px", lineHeight: "1.4" }}>
            {t("auth.tagline")}
          </p>

          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              background: "#F0F2F6",
              borderRadius: "100vw",
              padding: "4px",
              marginTop: "18px",
              gap: "4px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              style={{
                border: "none",
                borderRadius: "100vw",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.25s ease",
                backgroundColor: mode === "login" ? "#FFFFFF" : "transparent",
                color: mode === "login" ? "#040915" : "#6a798b",
                boxShadow: mode === "login" ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
              }}
            >
              {t("auth.login")}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              style={{
                border: "none",
                borderRadius: "100vw",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.25s ease",
                backgroundColor: mode === "register" ? "#FFFFFF" : "transparent",
                color: mode === "register" ? "#040915" : "#6a798b",
                boxShadow: mode === "register" ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
              }}
            >
              {t("auth.register")}
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div style={{ padding: "24px 32px 32px", maxHeight: "calc(85vh - 140px)", overflowY: "auto" }}>
          {errorMsg && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#991B1B",
                padding: "10px 14px",
                borderRadius: "12px",
                fontSize: "13px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                lineHeight: "1.4",
              }}
            >
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: "#ECFDF5",
                border: "1px solid #6EE7B7",
                color: "#065F46",
                padding: "10px 14px",
                borderRadius: "12px",
                fontSize: "13px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckIcon size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* GOOGLE OAUTH ONE-TAP BUTTON */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "12px 18px",
              borderRadius: "100vw",
              border: "1.5px solid #E5E7EB",
              background: "#FFFFFF",
              color: "#1F2937",
              fontSize: "14.5px",
              fontWeight: 700,
              cursor: googleLoading ? "wait" : "pointer",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
              transition: "all 0.2s ease",
              marginBottom: "18px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#D1D5DB";
              e.currentTarget.style.backgroundColor = "#F9FAFB";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#E5E7EB";
              e.currentTarget.style.backgroundColor = "#FFFFFF";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.04)";
            }}
          >
            {/* Authentic Google Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{googleLoading ? t("auth.googleLoading") : t("auth.google")}</span>
          </button>

          {/* DIVIDER */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0 20px" }}>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
            <span style={{ fontSize: "12px", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600 }}>{t("auth.emailDivider")}</span>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
          </div>

          {/* LOGIN FORM */}
          {mode === "login" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#040915", marginBottom: "6px" }}>
                  {t("auth.email")}
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@example.kz"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: "1px solid #D1D5DB",
                    fontSize: "14px",
                    color: "#040915",
                    outline: "none",
                    boxSizing: "border-box",
                    backgroundColor: "#FAFAFA",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#FE7505";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(254, 117, 5, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#D1D5DB";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "#040915" }}>{t("auth.password")}</label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(t("auth.forgotAlert"));
                    }}
                    style={{ fontSize: "12px", color: "#FE7505", textDecoration: "none", fontWeight: 600 }}
                  >
                    {t("auth.forgotPassword")}
                  </a>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 42px 12px 16px",
                      borderRadius: "12px",
                      border: "1px solid #D1D5DB",
                      fontSize: "14px",
                      color: "#040915",
                      outline: "none",
                      boxSizing: "border-box",
                      backgroundColor: "#FAFAFA",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#FE7505";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(254, 117, 5, 0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#D1D5DB";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#9CA3AF",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "100vw",
                  border: "none",
                  background: "linear-gradient(90deg, #FE7505 0%, #E24012 100%)",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: 800,
                  letterSpacing: "-0.2px",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(254, 117, 5, 0.35)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  marginTop: "6px",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {loading ? t("auth.loginLoading") : t("auth.loginSubmit")}
              </button>

            </form>
          )}

          {/* REGISTER FORM */}
          {mode === "register" && (
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#040915", marginBottom: "4px" }}>
                  {t("auth.name")}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t("auth.namePlaceholder")}
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #D1D5DB",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    backgroundColor: "#FAFAFA",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#040915", marginBottom: "4px" }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.kz"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #D1D5DB",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    backgroundColor: "#FAFAFA",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#040915", marginBottom: "4px" }}>
                  {t("auth.passwordHint")}
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #D1D5DB",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    backgroundColor: "#FAFAFA",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#040915", marginBottom: "4px" }}>
                    {t("auth.grade")}
                  </label>
                  <select
                    value={regGrade}
                    onChange={(e) => setRegGrade(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1px solid #D1D5DB",
                      fontSize: "13px",
                      backgroundColor: "#FAFAFA",
                    }}
                  >
                    <option value="11">{t("wizard.grade.11")}</option>
                    <option value="10">{t("wizard.grade.10")}</option>
                    <option value="9">{t("wizard.grade.9")}</option>
                    <option value="Выпускник школы">{t("wizard.grade.graduate")}</option>
                    <option value="Студент колледжа">{t("wizard.grade.college")}</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#040915", marginBottom: "4px" }}>
                    {t("auth.unt")}
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="140"
                    value={regUnt}
                    onChange={(e) => setRegUnt(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1px solid #D1D5DB",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      backgroundColor: "#FAFAFA",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#040915", marginBottom: "4px" }}>
                  {t("auth.interest")}
                </label>
                <select
                  value={regInterest}
                  onChange={(e) => setRegInterest(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid #D1D5DB",
                    fontSize: "13px",
                    backgroundColor: "#FAFAFA",
                  }}
                >
                  <option value="computer-science">{t("auth.interest.cs")}</option>
                  <option value="software-engineering">{t("auth.interest.se")}</option>
                  <option value="data-science">{t("auth.interest.ds")}</option>
                  <option value="cybersecurity">{t("auth.interest.cyber")}</option>
                  <option value="finance-fintech">{t("auth.interest.finance")}</option>
                  <option value="business-mgmt">{t("auth.interest.business")}</option>
                  <option value="medicine-general">{t("auth.interest.medicine")}</option>
                  <option value="engineering-tech">{t("auth.interest.engineering")}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "100vw",
                  border: "none",
                  background: "linear-gradient(90deg, #FE7505 0%, #E24012 100%)",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: 800,
                  letterSpacing: "-0.2px",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(254, 117, 5, 0.35)",
                  marginTop: "8px",
                }}
              >
                {loading ? t("auth.registerLoading") : t("auth.registerSubmit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
