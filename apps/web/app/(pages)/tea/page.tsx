'use client';

const experiences = [
  {
    title: '初訪體驗｜服務透明，讓人放鬆',
    author: 'Kevin · 台北金融業',
    summary:
      '第一次透過小夜安排，顧問先確認我的需求與預算，再給出 3 位適合的甜心。當天抵達後，房間整潔、流程清楚，甜心也非常自然健談，完全沒有被推銷的壓力。',
    highlights: ['預約前 1 小時再次確認，讓我很放心', '甜心準時、妝容自然', '服務結束後即時追蹤體驗感受'],
  },
  {
    title: '長期客戶的觀察與建議',
    author: 'Kenny · 南部連鎖品牌創辦人',
    summary:
      '過去一年我固定每月透過小夜預約 2–3 次。顧問會主動提醒適合的新人選，並提供加 LINE 客服的專屬連結。甜心的照片與本人高度一致，這點對我非常重要。',
    highlights: ['可指定地區、環境類型', '客服 30 分鐘內必回覆', '若臨時改期也能保持彈性'],
  },
  {
    title: '商務夥伴推薦的高品質管道',
    author: 'Yuki · 跨國行銷顧問',
    summary:
      '一開始抱著觀望心態，但見到甜心本人後，對於她的學習態度與禮儀印象深刻。平台會提供「約茶前溝通話題」懶人包，相當貼心。',
    highlights: ['每位甜心都有背景備註', '可以預先看到代號與地區', '成立專屬 Line 群組，安排第二次更快'],
  },
];

const principles = [
  {
    title: '公開透明',
    details:
      '所有價格皆於預約前確認，無套路、無加價。交易必須透過本人 LINE 帳號完成，顧問同步記錄地點、時間與甜心代號，保障雙方權益與追溯機制。',
  },
  {
    title: '經驗回饋循環',
    details: '每次預約結束後皆會匿名收集評分，超過 3 次負評的甜心即暫停曝光，並由顧問安排輔導，確保整體內容品質。',
  },
  {
    title: '專業團隊經營',
    details:
      '由 7 位以上資深顧問輪值，制定標準流程並於 30 分鐘內回覆。資料均採最小可視原則，使用加密管道處理，保護客戶隱私安全。',
  },
];

export default function TeaExperiencePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-pink">Experience</p>
        <h1 className="text-2xl font-semibold text-slate-900">約茶經驗分享</h1>
        <p className="text-sm text-slate-600">
          我們彙整真實客戶的心得、顧問的提醒與安全守則，幫助你更安心地安排每一次約茶。
        </p>
        <div className="mt-4 grid gap-4 text-left md:grid-cols-3">
          <div className="rounded-2xl border border-brand-light bg-white p-4 text-sm text-slate-600 shadow-sm">
            <p className="text-2xl font-semibold text-brand-pink">1,200+</p>
            <p>過去 12 個月的完成預約</p>
          </div>
          <div className="rounded-2xl border border-brand-light bg-white p-4 text-sm text-slate-600 shadow-sm">
            <p className="text-2xl font-semibold text-brand-pink">4.8 / 5</p>
            <p>整體體驗平均評分</p>
          </div>
          <div className="rounded-2xl border border-brand-light bg-white p-4 text-sm text-slate-600 shadow-sm">
            <p className="text-2xl font-semibold text-brand-pink">30 分鐘內</p>
            <p>客服平均回覆時間</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">真實客戶心得</h2>
          <p className="text-xs text-slate-500">內容經顧問整理後匿名公開</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {experiences.map((story) => (
            <article key={story.title} className="flex flex-col rounded-3xl border border-brand-light bg-white/90 p-5 shadow-sm">
              <div className="mb-2 text-xs font-medium text-brand-pink">#{story.author}</div>
              <h3 className="text-base font-semibold text-slate-900">{story.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{story.summary}</p>
              <ul className="mt-4 flex flex-col gap-2 text-xs text-slate-500">
                {story.highlights.map((highlight) => (
                  <li key={highlight} className="rounded-2xl bg-brand-light/40 px-3 py-2 text-slate-700">
                    {highlight}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">平台堅持三大原則</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {principles.map((principle) => (
            <div key={principle.title} className="rounded-2xl border border-brand-light bg-gradient-to-br from-white to-brand-light/40 p-4 shadow-sm">
              <p className="text-sm font-semibold text-brand-pink">{principle.title}</p>
              <p className="mt-2 text-sm text-slate-600">{principle.details}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-dashed border-brand-light bg-white/90 p-6 text-sm text-slate-600">
        <h2 className="text-lg font-semibold text-slate-900">安心約茶小提醒</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>預約前請再次確認甜心代號、地點與時間，若需更動請於 2 小時前聯絡客服。</li>
          <li>勿對甜心拍照、錄影或索取私人聯絡方式，違者將列入黑名單。</li>
          <li>若遇到與描述不符的情況，請立即透過 LINE 客服回報，我們將提供協助。</li>
        </ol>
        <p className="text-xs text-slate-400">以上內容由小夜顧問團隊整理，每月更新一次，讓你掌握最新的茶選趨勢。</p>
      </section>
    </div>
  );
}
