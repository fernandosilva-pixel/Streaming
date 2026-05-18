'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

export type Lang = 'pt' | 'en' | 'es'

const translations = {
  pt: {
    // Navbar
    signIn: 'Entrar',
    signUp: 'Criar conta',
    logout: 'Sair',

    // Auth modal — login
    loginTitle: 'Entrar',
    loginSubtitle: 'Acesse para assistir aos jogos ao vivo',
    emailLabel: 'E-mail',
    emailPlaceholder: 'seu@email.com',
    passwordLabel: 'Senha',
    passwordPlaceholder: '••••••••',
    signingIn: 'Entrando...',
    noAccount: 'Não tem conta?',
    createNow: 'Criar agora',
    wrongCredentials: 'E-mail ou senha incorretos.',

    // Auth modal — register
    registerTitle: 'Criar conta',
    registerSubtitle: 'Cadastre-se para assistir aos jogos ao vivo',
    nicknameLabel: 'Usuário (Apelido)',
    nicknamePlaceholder: 'Como quer ser chamado',
    creatingAccount: 'Criando conta...',
    alreadyHaveAccount: 'Já tem conta?',
    enterNow: 'Entrar',
    emailAlreadyUsed: 'E-mail já cadastrado. Faça login.',
    terms: 'Ao continuar você concorda com os termos de uso',

    // Player overlays
    restrictedContent: 'Conteúdo restrito',
    restrictedLogin: 'Já tem conta na Futzone? Faça o login e assista agora.',
    restrictedNoAccount: 'Ainda não tem conta? Crie sua conta e assista agora.',
    createAccount: 'Criar Conta',
    paidContent: 'Conteúdo pago',
    viaPix: 'via PIX para assistir',
    payAndWatch: 'Pagar e assistir',
    haveCode: 'Tenho um código',
    checkingAccess: 'Verificando acesso...',

    // Combined modal
    unlockGame: 'Liberar Jogo Completo',
    immediateAccess: 'Acesso imediato após confirmação',
    createAccountTab: 'Criar conta',
    alreadyHaveAccountTab: 'Já tenho conta',
    yourName: 'Seu nome',
    continue: 'Avançar →',
    copyPix: 'Copiar código PIX',
    copied: 'Copiado!',
    alreadyPaid: 'Já paguei',
    waitingConfirmation: 'Aguardando confirmação automática...',
    generating: 'Gerando QR Code...',
    confirmCode: 'Confirmar código',
    cancel: 'Cancelar',
    codePlaceholder: 'EX: FUTZONE2025',
    verifying: 'Verificando...',
    registering: 'Registrando...',

    // Payment modal
    streamAccess: 'Acesso à transmissão',
    payViaPix: 'para assistir ao vivo',
    paymentConfirmed: 'Pagamento confirmado!',
    releasingAccess: 'Liberando acesso...',
    waitingPayment: 'Aguardando confirmação automática do pagamento...',
    checkManually: 'Já paguei',

    // Sound hint
    soundHint: 'Som desativado? Coloque em tela cheia e aumente o volume.',

    // Onboarding
    chooseLang: 'Escolha seu idioma',
    whatToWatch: 'O que você quer assistir?',
  },
  en: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    logout: 'Logout',

    loginTitle: 'Sign In',
    loginSubtitle: 'Access to watch live games',
    emailLabel: 'Email',
    emailPlaceholder: 'your@email.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    signingIn: 'Signing in...',
    noAccount: "Don't have an account?",
    createNow: 'Create now',
    wrongCredentials: 'Incorrect email or password.',

    registerTitle: 'Create Account',
    registerSubtitle: 'Register to watch live games',
    nicknameLabel: 'Username (Nickname)',
    nicknamePlaceholder: 'What should we call you',
    creatingAccount: 'Creating account...',
    alreadyHaveAccount: 'Already have an account?',
    enterNow: 'Sign In',
    emailAlreadyUsed: 'Email already registered. Please log in.',
    terms: 'By continuing you agree to the terms of use',

    restrictedContent: 'Restricted content',
    restrictedLogin: 'Already have a Futzone account? Log in and watch now.',
    restrictedNoAccount: "Don't have an account yet? Create one and watch now.",
    createAccount: 'Create Account',
    paidContent: 'Paid content',
    viaPix: 'via PIX to watch',
    payAndWatch: 'Pay and watch',
    haveCode: 'I have a code',
    checkingAccess: 'Checking access...',

    unlockGame: 'Unlock Full Game',
    immediateAccess: 'Immediate access after confirmation',
    createAccountTab: 'Create account',
    alreadyHaveAccountTab: 'I already have an account',
    yourName: 'Your name',
    continue: 'Continue →',
    copyPix: 'Copy PIX code',
    copied: 'Copied!',
    alreadyPaid: 'I already paid',
    waitingConfirmation: 'Waiting for automatic confirmation...',
    generating: 'Generating QR Code...',
    confirmCode: 'Confirm code',
    cancel: 'Cancel',
    codePlaceholder: 'EX: FUTZONE2025',
    verifying: 'Verifying...',
    registering: 'Registering...',

    streamAccess: 'Stream Access',
    payViaPix: 'to watch live',
    paymentConfirmed: 'Payment confirmed!',
    releasingAccess: 'Releasing access...',
    waitingPayment: 'Waiting for automatic payment confirmation...',
    checkManually: 'I already paid',

    soundHint: 'No sound? Go fullscreen and turn up the volume.',

    // Onboarding
    chooseLang: 'Choose your language',
    whatToWatch: 'What do you want to watch?',
  },
  es: {
    signIn: 'Entrar',
    signUp: 'Registrarse',
    logout: 'Salir',

    loginTitle: 'Iniciar Sesión',
    loginSubtitle: 'Accede para ver partidos en vivo',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'tu@email.com',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: '••••••••',
    signingIn: 'Iniciando...',
    noAccount: '¿No tienes cuenta?',
    createNow: 'Crear ahora',
    wrongCredentials: 'Correo o contraseña incorrectos.',

    registerTitle: 'Crear Cuenta',
    registerSubtitle: 'Regístrate para ver partidos en vivo',
    nicknameLabel: 'Usuario (Apodo)',
    nicknamePlaceholder: '¿Cómo quieres que te llamemos?',
    creatingAccount: 'Creando cuenta...',
    alreadyHaveAccount: '¿Ya tienes cuenta?',
    enterNow: 'Iniciar Sesión',
    emailAlreadyUsed: 'Correo ya registrado. Inicia sesión.',
    terms: 'Al continuar aceptas los términos de uso',

    restrictedContent: 'Contenido restringido',
    restrictedLogin: '¿Ya tienes cuenta en Futzone? Inicia sesión y mira ahora.',
    restrictedNoAccount: '¿Aún no tienes cuenta? Crea una y mira ahora.',
    createAccount: 'Crear Cuenta',
    paidContent: 'Contenido de pago',
    viaPix: 'vía PIX para ver',
    payAndWatch: 'Pagar y ver',
    haveCode: 'Tengo un código',
    checkingAccess: 'Verificando acceso...',

    unlockGame: 'Desbloquear Partido Completo',
    immediateAccess: 'Acceso inmediato tras confirmación',
    createAccountTab: 'Crear cuenta',
    alreadyHaveAccountTab: 'Ya tengo cuenta',
    yourName: 'Tu nombre',
    continue: 'Continuar →',
    copyPix: 'Copiar código PIX',
    copied: '¡Copiado!',
    alreadyPaid: 'Ya pagué',
    waitingConfirmation: 'Esperando confirmación automática...',
    generating: 'Generando código QR...',
    confirmCode: 'Confirmar código',
    cancel: 'Cancelar',
    codePlaceholder: 'EJ: FUTZONE2025',
    verifying: 'Verificando...',
    registering: 'Registrando...',

    streamAccess: 'Acceso a la transmisión',
    payViaPix: 'para ver en vivo',
    paymentConfirmed: '¡Pago confirmado!',
    releasingAccess: 'Liberando acceso...',
    waitingPayment: 'Esperando confirmación automática del pago...',
    checkManually: 'Ya pagué',

    soundHint: '¿Sin sonido? Pon pantalla completa y sube el volumen.',

    // Onboarding
    chooseLang: 'Elige tu idioma',
    whatToWatch: '¿Qué quieres ver?',
  },
} satisfies Record<Lang, Record<string, string>>

type TranslationKey = keyof typeof translations.pt

type LanguageContextType = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('pt')

  useEffect(() => {
    const saved = localStorage.getItem('futzone_lang') as Lang | null
    if (saved && ['pt', 'en', 'es'].includes(saved)) setLangState(saved)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('futzone_lang', l)
  }

  function t(key: TranslationKey): string {
    return translations[lang][key] ?? translations.pt[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
