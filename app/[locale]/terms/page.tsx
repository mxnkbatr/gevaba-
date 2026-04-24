import { FileText } from "lucide-react";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'mn' ? 'Үйлчилгээний нөхцөл | Gevabal' : 'Terms of Service | Gevabal',
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  const validLang = locale === 'en' ? 'en' : 'mn';
  
  const t = (obj: { mn: string; en: string }) => obj[validLang];

  return (
    <div className="relative min-h-screen bg-cream text-ink selection:bg-gold/20">
      <div className="pointer-events-none absolute -top-24 right-[-20%] h-[min(42vh,380px)] w-[min(88vw,420px)] rounded-full bg-gold/8 blur-[95px]" />
      <div className="container relative z-10 mx-auto max-w-3xl px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[calc(var(--header-height-mobile,84px)+env(safe-area-inset-top,0px)+1.5rem)] sm:px-6">
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/18 bg-white/90 shadow-gold">
            <FileText size={28} className="text-gold-dark" strokeWidth={1.5} />
          </div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-dark/85">
            {t({ mn: "Хууль ёс", en: "Legal" })}
          </p>
          <h1 className="font-serif text-[2rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2.5rem] md:text-[2.75rem]">
            {t({ mn: "Үйлчилгээний нөхцөл", en: "Terms of Service" })}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-earth/65">
            {t({ mn: "Бидний үйлчилгээг ашиглах нөхцөл ба дүрэм.", en: "Rules and terms for using our services." })}
          </p>
        </div>
        
        <div className="monastery-card space-y-10 rounded-[1.75rem] border border-gold/14 bg-white/88 p-8 text-[15px] leading-[1.75] text-earth/80 shadow-gold backdrop-blur-sm md:p-12 md:text-[16px]">
          
          <section>
            <h2 className="mb-3 font-serif text-xl font-semibold text-ink">
              {t({ mn: "1. Танилцуулга", en: "1. Introduction" })}
            </h2>
            <p>
              {t({ 
                mn: "Gevabal аппликейшн нь уламжлалт шашин, зан үйлийн зөвлөгөө болон үйлчилгээг орчин үеийн технологиор дамжуулан хүргэнэ.", 
                en: "The Gevabal application provides traditional religious and ritual consultation services through modern technology." 
              })}
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-semibold text-ink">
              {t({ mn: "2. Насны хязгаарлалт", en: "2. Eligibility" })}
            </h2>
            <p>
              {t({ 
                mn: "Үйлчилгээг ашиглах, захиалга өгөхөд хэрэглэгч нь 18 ба түүнээс дээш насны байх шаардлагатай.", 
                en: "Users must be 18 years of age or older to use the service and book sessions." 
              })}
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-semibold text-ink">
              {t({ mn: "3. Үйлчилгээний чиглэл", en: "3. Services" })}
            </h2>
            <p>
              {t({ 
                mn: "Gevabal нь хэрэглэгчдийг мэргэжлийн лам, үзмэрчтэй цаг товлож уулзах, сүнслэг зөвлөгөө авах боломжоор хангана.", 
                en: "Gevabal provides users with the ability to book appointments and receive spiritual consultation with professional monks and practitioners." 
              })}
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-semibold text-ink">
              {t({ mn: "4. Төлбөр хэвийн болон буцаалт", en: "4. Payments & Refunds" })}
            </h2>
            <p>
              {t({ 
                mn: "Төлбөрийг QPay системээр хүлээн авна. Захиалсан цагаас доод тал нь 24 цагийн өмнө цуцалсан тохиолдолд төлбөрийг 100% буцааж олгоно.", 
                en: "Payments are processed via the QPay system. Sessions cancelled at least 24 hours before the scheduled time are eligible for a 100% refund." 
              })}
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-semibold text-ink">
              {t({ mn: "5. Хэрэглэгчийн ёс зүй", en: "5. User Conduct" })}
            </h2>
            <p>
              {t({ 
                mn: "Багш нарыг доромжлох, зүй бус үг хэллэг ашиглах, уулзалтыг нууцаар бичиж авахыг хатуу хориглоно.", 
                en: "Harassment of masters, use of inappropriate language, and recording sessions without permission are strictly prohibited." 
              })}
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-semibold text-ink">
              {t({ mn: "6. Оюуны өмч", en: "6. Intellectual Property" })}
            </h2>
            <p>
              {t({ 
                mn: "Аппликейшнд орсон бүх агуулга, мэдээлэл болон багш нарын зөвлөгөө нь Gevabal-ийн өмч байна.", 
                en: "All content, information, and consultations provided within the application are the intellectual property of Gevabal and the respective masters." 
              })}
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-semibold text-ink">
              {t({ mn: "7. Данс цуцлах", en: "7. Termination" })}
            </h2>
            <p>
              {t({ 
                mn: "Хэрэв хэрэглэгч үйлчилгээний нөхцөлийг зөрчвөл Gevabal нь хэрэглэгчийн дансыг түдгэлзүүлэх эсвэл хаах эрхтэй.", 
                en: "Gevabal reserves the right to suspend or terminate a user's account if they violate these terms of service." 
              })}
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-semibold text-ink">
              {t({ mn: "8. Хууль, дүрэм", en: "8. Governing Law" })}
            </h2>
            <p>
              {t({ 
                mn: "Энэхүү үйлчилгээний нөхцөлийг Монгол Улсын хууль тогтоомжийн дагуу зохицуулна.", 
                en: "These terms of service shall be governed by and construed in accordance with the laws of Mongolia." 
              })}
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-xl font-semibold text-ink">
              {t({ mn: "9. Холбоо барих", en: "9. Contact" })}
            </h2>
            <p>
              {t({ 
                mn: "Санал хүсэлт, асуулт байвал support@gevabal.mn хаягаар холбогдоно уу.", 
                en: "For any questions or feedback, please contact us at support@gevabal.mn." 
              })}
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

// Note: we don't export generateStaticParams here because this app has both
// dynamic data and Capacitor builds where static params can be handled elsewhere.
