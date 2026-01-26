'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/Header';
import { 
  Bell, 
  Globe, 
  Moon, 
  Shield, 
  User, 
  Mail, 
  Smartphone,
  Eye,
  Volume2,
  Clock,
  Check
} from 'lucide-react';

interface SettingToggleProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

function SettingToggle({ label, description, enabled, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        {description && (
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

interface SettingSectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

function SettingSection({ icon: Icon, title, children }: SettingSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <Icon className="w-5 h-5 text-slate-600" />
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="px-6">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations('pages.settings');
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    soundAlerts: false,
    desktopNotifications: true,
    darkMode: false,
    compactView: false,
    autoRefresh: true,
    twoFactor: false,
    sessionTimeout: true,
  });

  const updateSetting = (key: keyof typeof settings) => (value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <Header title={t('title')} />
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          <SettingSection icon={User} title={t('profile')}>
            <div className="py-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-blue-600">JW</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">James Wilson</p>
                  <p className="text-sm text-slate-500">james.wilson@thaibev.com</p>
                  <p className="text-xs text-slate-400 mt-1">{t('adminRole')}</p>
                </div>
              </div>
            </div>
          </SettingSection>

          <SettingSection icon={Bell} title={t('notifications')}>
            <SettingToggle
              label={t('emailNotifications')}
              description={t('emailNotificationsDesc')}
              enabled={settings.emailNotifications}
              onChange={updateSetting('emailNotifications')}
            />
            <SettingToggle
              label={t('pushNotifications')}
              description={t('pushNotificationsDesc')}
              enabled={settings.pushNotifications}
              onChange={updateSetting('pushNotifications')}
            />
            <SettingToggle
              label={t('soundAlerts')}
              description={t('soundAlertsDesc')}
              enabled={settings.soundAlerts}
              onChange={updateSetting('soundAlerts')}
            />
            <SettingToggle
              label={t('desktopNotifications')}
              description={t('desktopNotificationsDesc')}
              enabled={settings.desktopNotifications}
              onChange={updateSetting('desktopNotifications')}
            />
          </SettingSection>

          <SettingSection icon={Eye} title={t('appearance')}>
            <SettingToggle
              label={t('darkMode')}
              description={t('darkModeDesc')}
              enabled={settings.darkMode}
              onChange={updateSetting('darkMode')}
            />
            <SettingToggle
              label={t('compactView')}
              description={t('compactViewDesc')}
              enabled={settings.compactView}
              onChange={updateSetting('compactView')}
            />
            <SettingToggle
              label={t('autoRefresh')}
              description={t('autoRefreshDesc')}
              enabled={settings.autoRefresh}
              onChange={updateSetting('autoRefresh')}
            />
          </SettingSection>

          <SettingSection icon={Shield} title={t('security')}>
            <SettingToggle
              label={t('twoFactor')}
              description={t('twoFactorDesc')}
              enabled={settings.twoFactor}
              onChange={updateSetting('twoFactor')}
            />
            <SettingToggle
              label={t('sessionTimeout')}
              description={t('sessionTimeoutDesc')}
              enabled={settings.sessionTimeout}
              onChange={updateSetting('sessionTimeout')}
            />
          </SettingSection>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  {t('saved')}
                </>
              ) : (
                t('saveChanges')
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
