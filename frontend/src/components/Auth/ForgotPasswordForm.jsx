import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { forgotPassword } from '../../api/authApi';

export default function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);

  const schema = z.object({
    email: z.string().email(t('auth.email_invalid')),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await forgotPassword(data.email);
      // Réponse toujours générique côté backend : on affiche le même
      // message de succès que la demande ait abouti ou non (anti-enumeration).
      setSent(true);
    } catch (err) {
      if (err.response?.status === 429) {
        // Le rate-limit ne révèle rien sur l'existence du compte (il se
        // déclenche avant même que le controller ne s'exécute) : on peut
        // donc le signaler distinctement plutôt que d'afficher le faux succès.
        toast.error(err.response?.data?.message || t('auth.forgot_password_rate_limited'));
      } else {
        // Toute autre erreur (panne serveur, réseau...) : on garde le
        // message générique pour ne pas fuiter d'info sur le compte.
        setSent(true);
      }
    }
  };

  if (sent) {
    return <p className="text-sm text-slate-600 text-center">{t('auth.forgot_password_sent')}</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label htmlFor="forgot-password-email" className="block mb-1 text-sm font-medium text-gray-700">Email</label>
        <input
          id="forgot-password-email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
      >
        {isSubmitting ? t('auth.forgot_password_sending') : t('auth.forgot_password_submit')}
      </button>
    </form>
  );
}
