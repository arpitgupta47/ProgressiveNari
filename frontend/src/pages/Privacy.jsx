import Navbar from '../components/Navbar.jsx'
import { useLang } from '../context/LangContext.jsx'

export default function Privacy() {
  const { lang } = useLang()
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-16 max-w-4xl mx-auto px-4">
        <div className="card p-8">
          <h1 className="font-display text-3xl font-bold mb-2">{lang === 'hi' ? 'गोपनीयता नीति' : 'Privacy Policy'}</h1>
          <p className="text-muted text-sm mb-8">{lang === 'hi' ? 'अंतिम अपडेट: जनवरी 2024' : 'Last updated: January 2024'}</p>
          {[
            { title: lang === 'hi' ? '1. हम क्या जानकारी एकत्र करते हैं' : '1. Information We Collect', body: lang === 'hi' ? 'हम नाम, ईमेल, फोन नंबर, पता, और भुगतान जानकारी एकत्र करते हैं। Google से लॉगिन पर हम आपकी Google प्रोफाइल जानकारी भी प्राप्त करते हैं। हम आपकी स्थान जानकारी केवल तभी एकत्र करते हैं जब आप इसकी अनुमति देते हैं।' : 'We collect name, email, phone number, address, and payment information. For Google login, we also receive your Google profile information. We collect location data only with your explicit permission.' },
            { title: lang === 'hi' ? '2. जानकारी का उपयोग' : '2. How We Use Your Information', body: lang === 'hi' ? 'आपकी जानकारी का उपयोग: ऑर्डर संसाधित करने, भुगतान करने, सूचनाएं भेजने, और प्लेटफॉर्म सुधारने के लिए किया जाता है। हम आपकी जानकारी तीसरे पक्ष को नहीं बेचते।' : 'Your information is used to: process orders, facilitate payments, send notifications, and improve our platform. We never sell your data to third parties.' },
            { title: lang === 'hi' ? '3. डेटा सुरक्षा' : '3. Data Security', body: lang === 'hi' ? 'हम आपके डेटा की सुरक्षा के लिए SSL एन्क्रिप्शन और सुरक्षित सर्वर का उपयोग करते हैं। सभी भुगतान Razorpay के माध्यम से सुरक्षित रूप से संसाधित किए जाते हैं।' : 'We use SSL encryption and secure servers to protect your data. All payments are processed securely through Razorpay.' },
            { title: lang === 'hi' ? '4. कुकीज़' : '4. Cookies', body: lang === 'hi' ? 'हम लॉगिन सत्र और प्राथमिकताएं याद रखने के लिए कुकीज़ का उपयोग करते हैं। आप अपने ब्राउज़र सेटिंग्स से कुकीज़ को अक्षम कर सकते हैं।' : 'We use cookies to remember your login session and preferences. You can disable cookies in your browser settings.' },
            { title: lang === 'hi' ? '5. आपके अधिकार' : '5. Your Rights', body: lang === 'hi' ? 'आप अपनी जानकारी देख, संशोधित, या हटाने का अनुरोध कर सकते हैं। इसके लिए support@progressivenaari.com पर संपर्क करें।' : 'You can request to view, modify, or delete your information. Contact us at support@progressivenaari.com.' },
            { title: lang === 'hi' ? '6. स्थान डेटा' : '6. Location Data', body: lang === 'hi' ? 'हम आपकी स्थान जानकारी केवल पास के विक्रेता दिखाने के लिए उपयोग करते हैं। यह जानकारी सर्वर पर संग्रहीत नहीं की जाती और केवल आपके ब्राउज़र में रहती है।' : 'We use your location data only to show nearby sellers. This data is not stored on our servers and remains only in your browser.' }
          ].map(s => (
            <div key={s.title} className="mb-6">
              <h2 className="font-semibold text-gray-800 text-lg mb-2">{s.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}