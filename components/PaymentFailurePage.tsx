import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

interface PaymentFailurePageProps {
  orderId?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
}

const PaymentFailurePage: React.FC<PaymentFailurePageProps> = ({
  orderId,
  status,
  paymentStatus,
}) => {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setIsLeaving(true);
          setTimeout(() => navigate('/'), 400);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  const circumference = 2 * Math.PI * 22; // r=22
  const progress = (secondsLeft / 5) * circumference;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-app-bg z-50"
      style={{
        opacity: isLeaving ? 0 : 1,
        transition: 'opacity 0.4s ease',
        direction: 'rtl',
      }}
    >
      {/* Glowing background blobs */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(220,38,38,0.12) 0%, rgba(220,38,38,0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-40px',
          left: '20%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(72,51,131,0.08) 0%, rgba(72,51,131,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Card */}
      <div
        className="relative bg-white rounded-3xl shadow-xl px-8 py-10 flex flex-col items-center text-center mx-6"
        style={{
          maxWidth: '360px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(220,38,38,0.08), 0 4px 20px rgba(0,0,0,0.06)',
          animation: 'paymentFailureCardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {/* Error Icon Circle */}
        <div
          style={{
            width: '88px',
            height: '88px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            animation: 'paymentFailureIconPulse 2s ease-in-out infinite',
          }}
        >
          <AlertCircle
            size={44}
            strokeWidth={1.8}
            style={{ color: '#dc2626' }}
          />
        </div>

        {/* Title */}
        <h1
          className="text-app-text font-bold mb-2"
          style={{ fontSize: '22px', lineHeight: 1.3, fontFamily: 'Readex Pro, sans-serif' }}
        >
          فشلت عملية الدفع
        </h1>

        {/* Subtitle */}
        <p
          className="text-app-textSec mb-6"
          style={{ fontSize: '14px', lineHeight: 1.7, maxWidth: '260px' }}
        >
          لم يتم إتمام عملية الدفع بنجاح. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.
        </p>

        {/* Order & Status info */}
        {(orderId || status || paymentStatus) && (
          <div
            className="w-full rounded-2xl mb-6 text-right"
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              padding: '12px 16px',
            }}
          >
            {orderId && (
              <div className="flex justify-between items-center mb-1">
                <span style={{ fontSize: '12px', color: '#6E585B' }}>رقم الطلب</span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#100F19',
                    direction: 'ltr',
                  }}
                >
                  #{orderId}
                </span>
              </div>
            )}
            {paymentStatus && (
              <div className="flex justify-between items-center">
                <span style={{ fontSize: '12px', color: '#6E585B' }}>حالة الدفع</span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#dc2626',
                    background: '#fee2e2',
                    padding: '2px 10px',
                    borderRadius: '20px',
                  }}
                >
                  {paymentStatus === 'pending' ? 'معلق' : paymentStatus}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Countdown ring + text */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div style={{ position: 'relative', width: '56px', height: '56px' }}>
            <svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Track */}
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke="#f3e8ff"
                strokeWidth="4"
              />
              {/* Progress */}
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke="#483383"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference - progress}`}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800,
                color: '#483383',
                fontFamily: 'Readex Pro, sans-serif',
              }}
            >
              {secondsLeft}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#6E585B' }}>
            سيتم تحويلك إلى الصفحة الرئيسية تلقائياً
          </p>
        </div>

        {/* Manual redirect button */}
        <button
          onClick={() => {
            setIsLeaving(true);
            setTimeout(() => navigate('/'), 300);
          }}
          className="w-full flex items-center justify-center gap-2 font-bold rounded-2xl transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #483383 0%, #352C48 100%)',
            color: '#fff',
            fontSize: '14px',
            padding: '14px 0',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(72,51,131,0.3)',
          }}
        >
          <Home size={18} strokeWidth={2} />
          <span>العودة إلى الرئيسية</span>
        </button>
      </div>

      <style>{`
        @keyframes paymentFailureCardIn {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.92);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes paymentFailureIconPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,38,38,0.15); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(220,38,38,0); }
        }
      `}</style>
    </div>
  );
};

export default PaymentFailurePage;
