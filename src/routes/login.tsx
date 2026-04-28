import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Eye, EyeOff, Loader2, Zap, Shield, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — UrbanSim" },
      { name: "description", content: "Sign in to the UrbanSim smart city dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate({ to: "/" });
    return null;
  }

  const [loginEmail, setLoginEmail] = useState("admin@urbansim.city");
  const [loginPassword, setLoginPassword] = useState("admin123");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const result = await login(loginEmail, loginPassword);
    setLoginLoading(false);
    if (result.success) {
      navigate({ to: "/" });
    } else {
      setLoginError(result.error ?? "Login failed.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (!regName || !regEmail || !regPassword) {
      setRegError("Please fill in all required fields.");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters.");
      return;
    }
    setRegLoading(true);
    const result = await register(regName, regEmail, regPassword, regCity);
    setRegLoading(false);
    if (result.success) {
      navigate({ to: "/" });
    } else {
      setRegError(result.error ?? "Registration failed.");
    }
  };

  const fillDemo = (email: string, password: string) => {
    setLoginEmail(email);
    setLoginPassword(password);
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/20 via-background to-background p-10 lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-[var(--shadow-glow)]">
            <Grid3x3 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-gradient-primary">UrbanSim</div>
            <div className="text-xs text-muted-foreground">Smart City OS</div>
          </div>
        </div>

        <div className="relative space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Urban Infrastructure
              <br />
              <span className="text-gradient-primary">Failure Chain</span>
              <br />
              Simulator
            </h1>
            <p className="max-w-md text-sm text-muted-foreground">
              Monitor, simulate, and mitigate cascading infrastructure failures across smart city
              systems in real time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { icon: Zap, text: "Real-time cascade simulation" },
              { icon: Shield, text: "Mitigation strategies" },
              { icon: BarChart3, text: "Analytics & metrics" },
            ].map((f) => (
              <div
                key={f.text}
                className="flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5 text-xs text-foreground/80 backdrop-blur"
              >
                <f.icon className="h-3.5 w-3.5 text-primary" />
                {f.text}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
            {[
              { value: "6", label: "Infrastructure Systems" },
              { value: "248", label: "Simulations Run" },
              { value: "99.2%", label: "Uptime" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-gradient-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-muted-foreground">
          © 2026 UrbanSim · Smart City Infrastructure Platform
        </div>
      </div>

      {/* Right panel — auth forms */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow">
            <Grid3x3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-base font-bold text-gradient-primary">UrbanSim</span>
        </div>

        <div className="mx-auto w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Create Account</TabsTrigger>
            </TabsList>

            {/* LOGIN TAB */}
            <TabsContent value="login" className="space-y-6 pt-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
                <p className="text-sm text-muted-foreground">
                  Sign in to your UrbanSim operator account
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Quick demo access
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemo("admin@urbansim.city", "admin123")}
                    className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/20"
                  >
                    👤 Admin — admin@urbansim.city
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo("operator@urbansim.city", "ops123")}
                    className="rounded-md border border-success/40 bg-success/10 px-3 py-1.5 text-xs text-success transition-colors hover:bg-success/20"
                  >
                    🔧 Operator — operator@urbansim.city
                  </button>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email address</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@urbansim.city"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPwd ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showLoginPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {loginError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:opacity-90 active:scale-[0.98]"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* REGISTER TAB */}
            <TabsContent value="register" className="space-y-6 pt-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Create account</h2>
                <p className="text-sm text-muted-foreground">
                  Register as a new UrbanSim operator
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full name *</Label>
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder="Jane Doe"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-city">City</Label>
                    <Input
                      id="reg-city"
                      type="text"
                      placeholder="Your city"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email address *</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showRegPwd ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showRegPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {regError && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {regError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={regLoading}
                  className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:opacity-90 active:scale-[0.98]"
                >
                  {regLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  New accounts are created with Operator role.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
