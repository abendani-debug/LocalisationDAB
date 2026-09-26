import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../api/authApi';
import toast from 'react-hot-toast';
import PasswordInput from '../UI/PasswordInput';

export default function ResetPasswordForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const schema = z.object({
    newPassword: z.string()
      .min(8, t('auth.min_8_chars'))
      .regex(/[A-Z]/, t('auth.must_uppercase'))
      .regex(/[0-9]/, t('auth.must_digit')),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('auth.passwords_must_match'),
    path: ['confirmPassword'],
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await resetPassword(token, data.newPassword);
      toast.success(t('auth.reset_password_success'));
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.reset_password_error'));
    }
  };

  if (!token) {
    return <p className="text-sm text-red-600 text-center">{t('auth.reset_password_no_token')}</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label htmlFor="reset-password-new" className="block mb-1 text-sm font-medium text-gray-700">{t('auth.new_password')}</label>
        <PasswordInput
          id="reset-password-new"
          autoComplete="new-password"
          {...register('newPassword')}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors"
        />
        {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>}
      </div>
      <div>
        <label htmlFor="reset-password-confirm" className="block mb-1 text-sm font-medium text-gray-700">{t('auth.confirm_password')}</label>
        <PasswordInput
          id="reset-password-confirm"
          autoComplete="new-password"
          {...register('confirmPassword')}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors"
        />
        {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
      >
        {isSubmitting ? t('auth.reset_password_submitting') : t('auth.reset_password_submit')}
      </button>
    </form>
  );
}
