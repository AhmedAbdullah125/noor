import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
   ArrowRight,
   Clock,
   CheckCircle2,
   Ticket,
   AlertCircle,
   ChevronDown,
   CalendarDays,
   CreditCard,
   FileText,
   Timer
} from 'lucide-react';
import { DEMO_PRODUCTS, FALLBACK_IMAGE_URL } from '../constants';
import AppImage from './AppImage';
import { UserSubscription } from '../types';
import AppHeader from './AppHeader';
import { http } from './services/http';
import { translations, getLang } from '../services/i18n';

type ApiSession = {
   id: number;
   request_id: number;
   session_number: number;
   status: string;
   session_date: string | null;
   start_time: string | null;
   customer_notes: string | null;
};

type ApiSubscriptionItem = {
   id: number;
   request_number: string;
   service: string;
   subscription_name: string;
   subscription_description: string;
   status: string;
   is_confirmed: boolean;
   payment_type: string;
   payment_status: string;
   session_count: number;
   completed_sessions: number;
   remaining_sessions: number;
   next_session: ApiSession | null;
   sessions: ApiSession[];
   end_date: string;
   base_price: string;
   options_price: string;
   final_price: string;
};

type ApiResponse = {
   status: boolean;
   statusCode: number;
   message: string;
   items: ApiSubscriptionItem[];
};

function normalizeTime(t?: string | null) {
   if (!t) return "";
   return String(t).slice(0, 5);
}

function mapStatus(apiStatus: string, remaining: number): UserSubscription["status"] {
   const s = String(apiStatus || "").toLowerCase();
   if (remaining <= 0) return "expired";
   if (s === "paused") return "paused";
   if (s === "pending") return "pending";
   if (s === "expired" || s === "completed" || s === "canceled" || s === "cancelled") return "expired";
   return "active";
}

function pickServiceIdByName(name: string) {
   const n = String(name || "").trim();
   const hit =
      DEMO_PRODUCTS.find((p: any) => String(p.name).trim() === n) ??
      DEMO_PRODUCTS.find((p: any) => String(p.name).includes(n) || n.includes(String(p.name)));
   return hit?.id ?? 0;
}

const SubscriptionDetailsPage: React.FC = () => {
   const navigate = useNavigate();
   const { subscriptionId } = useParams();
   const location = useLocation();
   const lang = getLang();
   const t = translations[lang] || translations['ar'];

   const [subscription, setSubscription] = useState<UserSubscription | null>(null);
   const [apiItem, setApiItem] = useState<ApiSubscriptionItem | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [showTerms, setShowTerms] = useState(false);
   const isNewPurchase = location.state?.success;

   useEffect(() => {
      let mounted = true;

      (async () => {
         try {
            setIsLoading(true);
            const res = await http.get<ApiResponse>("/requests/subscriptions", { headers: { lang } });
            if (!mounted || !res?.data?.status) return;

            const items = res.data.items ?? [];
            const it = items.find(x => String(x.id) === subscriptionId);

            if (it) {
               setApiItem(it);
               const serviceId = pickServiceIdByName(it.service);
               const next = it.next_session?.session_date
                  ? {
                     date: it.next_session.session_date,
                     time: normalizeTime(it.next_session.start_time),
                  }
                  : null;

               setSubscription({
                  id: String(it.id),
                  serviceId,
                  packageTitle: it.subscription_name,
                  sessionsTotal: Number(it.session_count ?? 0),
                  sessionsUsed: Number(it.completed_sessions ?? 0),
                  expiryDate: it.end_date,
                  nextSession: next,
                  status: mapStatus(it.status, Number(it.remaining_sessions ?? 0)),
               } as UserSubscription);
            }
         } catch (err) {
            console.error("Failed to fetch subscription details:", err);
         } finally {
            if (mounted) setIsLoading(false);
         }
      })();

      return () => {
         mounted = false;
      };
   }, [subscriptionId, lang]);

   const service = useMemo(() => {
      if (!subscription) return null;
      const found = DEMO_PRODUCTS.find(p => p.id === subscription.serviceId);
      if (found) return found;

      return {
         id: subscription.serviceId,
         name: apiItem?.service || subscription.packageTitle,
         price: apiItem?.final_price ? `${apiItem.final_price} د.ك` : "",
         image: FALLBACK_IMAGE_URL,
         images: [FALLBACK_IMAGE_URL],
         description: apiItem?.subscription_description || "",
         duration: ""
      };
   }, [subscription, apiItem]);

   const history = useMemo(() => {
      if (!apiItem?.sessions) return [];
      return [...apiItem.sessions].sort((a, b) => b.session_number - a.session_number);
   }, [apiItem]);

   if (isLoading) {
      return (
         <div className="flex flex-col h-full bg-app-bg animate-fadeIn">
            <AppHeader title={t.bookingDetails || "تفاصيل الاشتراك"} onBack={() => navigate('/subscriptions')} />
            <div className="flex-1 flex items-center justify-center relative z-10">
               <div className="w-8 h-8 border-4 border-app-gold border-t-transparent rounded-full animate-spin" />
            </div>
         </div>
      );
   }

   if (!subscription || !service) {
      return (
         <div className="flex flex-col h-full bg-app-bg animate-fadeIn">
            <AppHeader title={t.bookingDetails || "تفاصيل الاشتراك"} onBack={() => navigate('/subscriptions')} />
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
               <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} />
               </div>
               <h3 className="text-lg font-semibold text-app-text mb-2">{t.errorLoading || "حدث خطأ"}</h3>
               <p className="text-sm text-app-textSec mb-6">{t.noResults || "لا توجد تفاصيل لهذا الاشتراك"}</p>
               <button
                  onClick={() => navigate('/subscriptions')}
                  className="bg-app-gold text-white px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
               >
                  {t.back || "العودة"}
               </button>
            </div>
         </div>
      );
   }

   const remaining = subscription.sessionsTotal - subscription.sessionsUsed;
   const progressPercent = subscription.sessionsTotal > 0 ? (remaining / subscription.sessionsTotal) * 100 : 0;
   const isExpired = subscription.status === 'expired' || remaining <= 0;

   const getStatusStyle = (status: UserSubscription['status']) => {
      switch (status) {
         case 'active': return 'bg-green-100 text-green-700 border-green-200';
         case 'expired': return 'bg-red-100 text-red-700 border-red-200';
         case 'paused': return 'bg-orange-100 text-orange-700 border-orange-200';
         case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
         default: return 'bg-gray-100 text-gray-700';
      }
   };

   const getStatusLabel = (status: UserSubscription['status']) => {
      switch (status) {
         case 'active': return t.activeStatus;
         case 'expired': return t.expiredStatus;
         case 'paused': return t.pausedStatus;
         case 'pending': return t.pendingStatus;
         default: return '';
      }
   };

   const handleBookNext = () => {
      navigate(`/book-next-session/${subscription.id}`);
   };

   const handleEditAppointment = () => {
      navigate(`/edit-appointment/${subscription.id}`);
   };

   return (
      <div className="flex flex-col h-full bg-app-bg relative font-active overflow-hidden min-h-screen animate-fadeIn" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
         <AppHeader
            title={t.bookingDetails || "تفاصيل الاشتراك"}
            onBack={() => navigate('/subscriptions')}
         />

         {/* Success Toast */}
         {isNewPurchase && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-green-500 text-white py-3 px-4 rounded-2xl shadow-xl flex items-center gap-3 z-[60] animate-slideUp">
               <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={16} strokeWidth={3} />
               </div>
               <span className="font-semibold text-sm">{t.requestSuccess || "تم شراء الباقة بنجاح"}</span>
            </div>
         )}

         <div className="flex-1 overflow-y-auto no-scrollbar pb-28 px-6 pt-24 space-y-6">

            {/* 2) Top Summary Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <h2 className="text-xs font-semibold text-app-textSec mb-1">{service.name}</h2>
                     <h3 className="text-base font-semibold text-app-text">{subscription.packageTitle}</h3>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${getStatusStyle(subscription.status)}`}>
                     {getStatusLabel(subscription.status)}
                  </span>
               </div>

               <div className="flex items-center gap-4 mb-6 text-xs text-app-textSec">
                  <div className="flex items-center gap-1.5">
                     <Timer size={14} />
                     <span>{t.expiresOn.replace('{date}', subscription.expiryDate)}</span>
                  </div>
               </div>

               <div className="bg-app-bg/50 rounded-2xl p-4">
                  <div className="flex justify-between items-end mb-2">
                     <span className="text-xs font-semibold text-app-textSec">{t.subscriptionReamining}</span>
                     <span className="text-sm font-semibold text-app-gold">{remaining} {t.of} {subscription.sessionsTotal}</span>
                  </div>
                  <div className="w-full h-2 bg-app-card rounded-full overflow-hidden mb-2">
                     <div
                        className={`h-full rounded-full transition-all duration-1000 ${isExpired ? 'bg-gray-400' : 'bg-app-gold'}`}
                        style={{ width: `${progressPercent}%` }}
                     />
                  </div>
                  <p className="text-[9px] text-app-textSec opacity-80">
                     {t.subscriptionUsed.replace('{used}', String(subscription.sessionsUsed)).replace('{total}', String(subscription.sessionsTotal))}
                  </p>
               </div>
            </div>
            {apiItem?.payment_status === 'un_paid' && (
               <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3 text-orange-600">
                  <AlertCircle size={20} />
                  <span className="font-semibold text-sm">
                     {lang === 'ar' ? 'الاشتراك غير مدفوع' : 'Subscription is unpaid'}
                  </span>
               </div>
            )}

            {isExpired && (
               <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600">
                  <AlertCircle size={20} />
                  <span className="font-semibold text-sm">{t.subscriptionExpired || "هذا الاشتراك منتهي"}</span>
               </div>
            )}

            {/* 3) Next Session Card */}
            {!isExpired && (
               <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
                  <div className="flex items-center gap-2 mb-4">
                     <CalendarDays size={20} className="text-app-gold" />
                     <h3 className="text-sm font-semibold text-app-text">{t.nextSession}</h3>
                  </div>

                  {subscription.nextSession ? (
                     <>
                        <div className="bg-app-gold/5 border border-app-gold/20 rounded-2xl p-4 mb-4 flex justify-between items-center">
                           <div className="flex flex-col">
                              <span className="text-sm font-semibold text-app-text" dir="ltr">{subscription.nextSession.date}</span>
                              <span className="text-xs text-app-textSec mt-1" dir="ltr">{subscription.nextSession.time}</span>
                           </div>
                           <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-600 shadow-sm">
                              <CheckCircle2 size={20} />
                           </div>
                        </div>
                        <p className="text-[10px] text-app-textSec mb-4 flex items-center gap-1.5">
                           <AlertCircle size={12} />
                           {lang === 'ar' ? 'يرجى الحضور قبل الموعد بـ 10 دقائق' : 'Please arrive 10 minutes early'}
                        </p>

                     </>
                  ) : (
                     <>
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-4 text-center">
                           <span className="text-sm font-semibold text-app-textSec">{t.undefinedSession}</span>
                        </div>
                        <button
                           onClick={handleBookNext}
                           className="w-full bg-app-gold text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-app-gold/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        >
                           <CalendarDays size={18} />
                           <span>{lang === 'ar' ? 'احجزي الجلسة القادمة' : 'Book Next Session'}</span>
                        </button>
                     </>
                  )}
               </div>
            )}

            {/* 5) Features Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
               <div className="flex items-center gap-2 mb-4">
                  <Ticket size={20} className="text-app-gold" />
                  <h3 className="text-sm font-semibold text-app-text">{lang === 'ar' ? 'ماذا يتضمن الاشتراك؟' : 'What does this subscription include?'}</h3>
               </div>
               <div className="space-y-3">
                  {[
                     lang === 'ar' ? `يشمل جلسات خدمة (${service.name})` : `Includes sessions for (${service.name})`,
                     lang === 'ar' ? 'الحجز حسب المواعيد المتاحة' : 'Booking based on availability',
                     lang === 'ar' ? 'تذكير تلقائي قبل الموعد' : 'Automatic reminder before appointment'
                  ].map((item, idx) => (
                     <div key={idx} className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-app-gold/10 text-app-gold flex items-center justify-center shrink-0 mt-0.5">
                           <CheckCircle2 size={12} strokeWidth={3} />
                        </div>
                        <span className="text-sm text-app-text">{item}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* 6) Conditions Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-app-card/30">
               <div className="flex items-center gap-2 mb-4">
                  <FileText size={20} className="text-app-gold" />
                  <h3 className="text-sm font-semibold text-app-text">{lang === 'ar' ? 'الشروط' : 'Conditions'}</h3>
               </div>
               <ul className="list-disc list-outside pr-4 text-xs text-app-textSec space-y-2 mb-3 leading-relaxed">
                  <li>{t.expiresOn.replace('{date}', subscription.expiryDate)}</li>
                  {subscription.minGapDays && <li>{lang === 'ar' ? 'الحد الأدنى بين الجلسات:' : 'Min gap between sessions:'} {subscription.minGapDays} {t.days}</li>}
                  <li>{lang === 'ar' ? 'سياسة الإلغاء: يمكن الإلغاء قبل 24 ساعة' : 'Cancellation policy: Can cancel 24 hours before'}</li>
                  <li>{lang === 'ar' ? 'عدم الحضور: يتم خصم الجلسة' : 'No-show: Session will be deducted'}</li>
               </ul>
               <button
                  onClick={() => setShowTerms(true)}
                  className="text-xs font-semibold text-app-gold underline"
               >
                  {lang === 'ar' ? 'عرض جميع الشروط' : 'View all conditions'}
               </button>
            </div>

            {/* 7) Sessions History */}
            <div className="pb-8">
               <h3 className="text-sm font-semibold text-app-text mb-4 px-2">{t.history || "سجل الجلسات"}</h3>
               {history.length > 0 ? (
                  <div className="space-y-3">
                     {history.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-app-card/30 flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                 <CheckCircle2 size={16} />
                              </div>
                              <div>
                                 <span className="block text-xs font-semibold text-app-text">
                                    {t.session} {item.session_number}
                                 </span>
                                 <span className="text-[10px] text-app-textSec" dir="ltr">
                                    {item.session_date} - {normalizeTime(item.start_time)}
                                 </span>
                              </div>
                           </div>
                           <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${item.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                              {item.status === 'completed' ? t.completed : item.status}
                           </span>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="text-center py-8 bg-white rounded-2xl border border-app-card/30 border-dashed">
                     <p className="text-sm text-app-textSec">{t.noContentYet || "لا يوجد سجل جلسات حتى الآن"}</p>
                  </div>
               )}
            </div>

         </div>

         {showTerms && (
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end animate-fadeIn">
               <div
                  className="w-full bg-white rounded-t-[2rem] p-8 max-h-[80%] overflow-y-auto animate-slideUp relative"
                  onClick={(e) => e.stopPropagation()}
               >
                  <button
                     onClick={() => setShowTerms(false)}
                     className="absolute top-6 right-6 p-2 bg-app-bg rounded-full text-app-text hover:bg-app-card"
                  >
                     <ChevronDown size={24} />
                  </button>
                  <h2 className="text-lg font-semibold text-app-text mb-6">{lang === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}</h2>
                  <div className="space-y-4">
                     <p className="text-sm text-app-text leading-relaxed">
                        {lang === 'ar'
                           ? "1. هذا الاشتراك شخصي ولا يمكن تحويله لشخص آخر."
                           : "1. This subscription is personal and cannot be transferred to another person."}
                     </p>
                     <p className="text-sm text-app-text leading-relaxed">
                        {lang === 'ar'
                           ? "2. العربون المدفوع لحجز الجلسات غير مسترجع في حال إلغاء الموعد قبل أقل من 24 ساعة أو عدم الحضور."
                           : "2. The deposit paid for booking sessions is non-refundable in case of cancellation less than 24 hours before or no-show."}
                     </p>
                     <p className="text-sm text-app-text leading-relaxed">
                        {lang === 'ar'
                           ? "3. يجب استهلاك جميع الجلسات قبل تاريخ انتهاء الصلاحية الموضح."
                           : "3. All sessions must be consumed before the indicated expiration date."}
                     </p>
                  </div>
                  <div className="h-10" />
               </div>
               <div className="absolute inset-0 -z-10" onClick={() => setShowTerms(false)} />
            </div>
         )}
      </div>
   );
};

export default SubscriptionDetailsPage;