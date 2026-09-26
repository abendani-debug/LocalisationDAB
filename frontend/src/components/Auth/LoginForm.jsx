import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login as loginApi } from '../../api/authApi';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginForm({ onSuccess }) {
  const { t } = useTranslation();
  const { login } = useAuth();

  const schema = z.object({
    email:    z.string().email(t('auth.email_invalid')),
    password: z.string().min(1, t('auth.password_required')),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const res = await loginApi(data);
      login(res.data.token, res.data.user);
      toast.success(t('auth.login_success'));
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.invalid_credentials'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          {...register('email')}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">Mot de passe</label>
          <Link to="/mot-de-passe-oublie" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            {t('auth.forgot_password_link')}
          </Link>
        </div>
        <input
          type="password"
          {...register('password')}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors"
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
      >
        {isSubmitting ? t('auth.logging_in') : t('auth.login_btn')}
      </button>
    </form>
  );
}
