import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { register as registerApi } from '../../api/authApi';
import toast from 'react-hot-toast';
import PasswordInput from '../UI/PasswordInput';

export default function RegisterForm({ onSuccess }) {
  const { t } = useTranslation();

  const schema = z.object({
    nom:      z.string().min(2, t('auth.name_required')).max(100),
    email:    z.string().email(t('auth.email_invalid')),
    password: z.string().min(8, t('auth.min_8_chars')).regex(/[A-Z]/, t('auth.must_uppercase')).regex(/[0-9]/, t('auth.must_digit')),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await registerApi(data);
      toast.success(t('auth.account_created'));
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.register_error'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Nom</label>
        <input
          type="text"
          {...register('nom')}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors"
        />
        {errors.nom && <p className="mt-1 text-xs text-red-600">{errors.nom.message}</p>}
      </div>
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
        <label className="block mb-1 text-sm font-medium text-gray-700">Mot de passe</label>
        <PasswordInput
          autoComplete="new-password"
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
        {isSubmitting ? t('auth.registering') : t('auth.register_btn')}
      </button>
    </form>
  );
}
