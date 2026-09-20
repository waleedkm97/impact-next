'use client';

import { Suspense, useEffect, useState } from 'react';
import { settingsRepository } from '@/lib/data/repositories/settings-repository';

export default function Settings() {
    const [s, setS] = useState<any>(null);

    const [siteName, setSiteName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsapp, setWhatsapp] = useState('');

    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        void settingsRepository.findAll().then(x => {
            setS(x);
            setSiteName(x.general.siteName ?? '');
            setEmail(x.contact.email ?? '');
            setPhone(x.contact.phone ?? '');
            setWhatsapp((x.contact as any).whatsapp ?? '');
        });
    }, []);

    async function save(e: React.FormEvent) {
        e.preventDefault();

        setSaving(true);
        setSaved(false);

        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    general: {
                        siteName,
                    },
                    contact: {
                        email,
                        phone,
                        whatsapp,
                    },
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || 'تعذر حفظ الإعدادات.',
                );
            }

            setS(data.settings);

            await settingsRepository.update({
                general: {
                    siteName,
                },
                contact: {
                    email,
                    phone,
                    whatsapp,
                },
            } as any);

            setSaved(true);

            setTimeout(() => {
                setSaved(false);
            }, 1800);
        } catch (error) {
            console.error(
                'Failed to save settings:',
                error,
            );

            alert(
                error instanceof Error
                    ? error.message
                    : 'تعذر حفظ الإعدادات. حاول مرة أخرى.',
            );
        } finally {
            setSaving(false);
        }
    }

    if (!s) {
        return (
            <main className="admin-page">
                جاري التحميل...
            </main>
        );
    }

    return (
        <main className="admin-page">
            <header className="admin-page-header">
                <div>
                    <div className="eyebrow">
                        Admin
                    </div>

                    <h1>
                        الإعدادات
                    </h1>

                    <p>
                        الإعدادات العامة وبيانات التواصل للموقع.
                    </p>
                </div>
            </header>

            <form
                className="admin-card"
                style={{
                    padding: 22,
                    maxWidth: 850,
                }}
                onSubmit={save}
            >
                <div className="admin-form-grid">

                    {/* اسم الموقع */}
                    <div className="admin-field">
                        <label>
                            اسم الموقع
                        </label>

                        <input
                            className="admin-input"
                            value={siteName}
                            onChange={e =>
                                setSiteName(e.target.value)
                            }
                        />
                    </div>

                    {/* البريد الإلكتروني */}
                    <div className="admin-field">
                        <label>
                            البريد الإلكتروني
                        </label>

                        <input
                            className="admin-input"
                            type="email"
                            value={email}
                            onChange={e =>
                                setEmail(e.target.value)
                            }
                        />
                    </div>

                    {/* الهاتف */}
                    <div className="admin-field">
                        <label>
                            الهاتف
                        </label>

                        <input
                            className="admin-input"
                            value={phone}
                            onChange={e =>
                                setPhone(e.target.value)
                            }
                            placeholder="مثال: 9665XXXXXXXX"
                        />
                    </div>

                    {/* الواتساب */}
                    <div className="admin-field">
                        <label>
                            رقم الواتساب
                        </label>

                        <input
                            className="admin-input"
                            value={whatsapp}
                            onChange={e =>
                                setWhatsapp(e.target.value)
                            }
                            placeholder="مثال: 9665XXXXXXXX"
                        />

                        <small
                            style={{
                                display: 'block',
                                marginTop: 6,
                                fontSize: 12,
                                color: '#6b7280',
                            }}
                        >
                            اكتب الرقم بصيغة دولية بدون علامة +
                        </small>
                    </div>

                    {/* العملة */}
                    <div className="admin-field">
                        <label>
                            العملة
                        </label>

                        <input
                            className="admin-input"
                            value={
                                s.general.currency ?? 'SAR'
                            }
                            readOnly
                        />
                    </div>

                </div>

                <div
                    className="admin-modal-footer"
                    style={{
                        padding: '20px 0 0',
                        border: 0,
                    }}
                >
                    <button
                        type="submit"
                        className="admin-btn admin-btn-primary"
                        disabled={saving}
                    >
                        {saving
                            ? 'جاري الحفظ...'
                            : 'حفظ التغييرات'}
                    </button>

                    {saved && (
                        <span
                            style={{
                                color: '#198754',
                                fontSize: 13,
                            }}
                        >
                            تم الحفظ ✓
                        </span>
                    )}
                </div>
            </form>
        </main>
    );
}