import { useTranslation } from 'react-i18next';
import ResetPasswordForm from '../components/Auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-[400px] p-8 shadow-sm border border-slate-100">
        <h1 className="m-0 mb-6 text-2xl font-bold text-gray-900 text-center">{t('auth.reset_password_title')}</h1>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
