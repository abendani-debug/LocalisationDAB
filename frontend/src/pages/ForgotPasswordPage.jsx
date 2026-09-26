import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ForgotPasswordForm from '../components/Auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-[400px] p-8 shadow-sm border border-slate-100">
        <h1 className="m-0 mb-2 text-2xl font-bold text-gray-900 text-center">{t('auth.forgot_password_title')}</h1>
        <p className="text-sm text-slate-500 text-center mb-6">{t('auth.forgot_password_subtitle')}</p>
        <ForgotPasswordForm />
        <p className="text-center mt-4 text-sm text-slate-500">
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">{t('auth.back_to_login')}</Link>
        </p>
      </div>
    </div>
  );
}
