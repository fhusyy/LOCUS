import { AdmissionApp } from "@/components/admission-app";
import { I18nProvider } from "@/components/i18n-provider";

export default function Home() {
  return (
    <I18nProvider>
      <AdmissionApp />
    </I18nProvider>
  );
}

