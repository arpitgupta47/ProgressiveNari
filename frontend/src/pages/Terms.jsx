import Navbar from '../components/Navbar.jsx'
import { useLang } from '../context/LangContext.jsx'

export default function Terms() {
  const { lang } = useLang()
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-28 pb-16 max-w-4xl mx-auto px-4">
        <div className="card p-8">
          <h1 className="font-display text-3xl font-bold mb-2">{lang === 'hi' ? 'नियम और शर्तें' : 'Terms & Conditions'}</h1>
          <p className="text-muted text-sm mb-8">{lang === 'hi' ? 'अंतिम अपडेट: जनवरी 2024' : 'Last updated: January 2024'}</p>
          {[
            { title: lang === 'hi' ? '1. सेवा की शर्तें' : '1. Acceptance of Terms', body: lang === 'hi' ? 'प्रोग्रेसिव नारी प्लेटफॉर्म का उपयोग करके, आप इन नियमों और शर्तों से सहमत होते हैं। यदि आप सहमत नहीं हैं, तो कृपया इस प्लेटफॉर्म का उपयोग न करें।' : 'By using Progressive Naari, you agree to be bound by these Terms. If you do not agree, please do not use the platform.' },
            { title: lang === 'hi' ? '2. विक्रेता पंजीकरण (केवल महिलाएं)' : '2. Seller Registration (Women Only)', body: lang === 'hi' ? 'प्रोग्रेसिव नारी पर विक्रेता पंजीकरण केवल महिला उद्यमियों के लिए है। झूठी जानकारी देकर पंजीकरण करने पर खाता तुरंत बंद किया जाएगा।' : 'Seller registration on Progressive Naari is exclusively for women entrepreneurs. Any false representation will result in immediate account termination.' },
            { title: lang === 'hi' ? '3. प्लेटफॉर्म शुल्क' : '3. Platform Fee', body: lang === 'hi' ? 'प्रत्येक सफल ऑर्डर पर ₹10 का प्लेटफॉर्म शुल्क लिया जाएगा। यह शुल्क ग्राहक द्वारा भुगतान की गई कुल राशि से काटा जाएगा। विक्रेता को शेष राशि डिलीवरी के 24-48 घंटे के भीतर मिलेगी।' : 'A platform fee of ₹10 is charged on every successful order. This fee is deducted from the total amount paid by the customer. The seller receives the remaining amount within 24-48 hours of delivery.' },
            { title: lang === 'hi' ? '4. भुगतान और रिफंड' : '4. Payments & Refunds', body: lang === 'hi' ? 'सभी भुगतान Razorpay के माध्यम से सुरक्षित रूप से संसाधित किए जाते हैं। रिफंड 5-7 कार्यदिवसों के भीतर मूल भुगतान विधि में वापस किया जाएगा। विवाद की स्थिति में, हमारी सपोर्ट टीम से संपर्क करें।' : 'All payments are processed securely via Razorpay. Refunds will be processed to the original payment method within 5-7 business days. For disputes, please contact our support team.' },
            { title: lang === 'hi' ? '5. उत्पाद नीति' : '5. Product Policy', body: lang === 'hi' ? 'विक्रेता केवल वही उत्पाद बेच सकते हैं जो उनके द्वारा बनाए गए हों या जिन पर उनका अधिकार हो। नकली, अवैध या हानिकारक उत्पाद बेचना सख्त मना है।' : 'Sellers can only sell products they make or have rights to. Selling counterfeit, illegal, or harmful products is strictly prohibited.' },
            { title: lang === 'hi' ? '6. डिलीवरी' : '6. Delivery', body: lang === 'hi' ? 'तीन डिलीवरी विकल्प उपलब्ध हैं: सेल्फ पिकअप (निःशुल्क), सेलर डिलीवरी (₹50), और कंपनी डिलीवरी (₹200)। डिलीवरी का समय विक्रेता और डिलीवरी प्रकार पर निर्भर करता है।' : 'Three delivery options: Self Pickup (Free), Seller Delivery (₹50), Company Delivery (₹200). Delivery time depends on seller and delivery type.' },
            { title: lang === 'hi' ? '7. खाता बंद करना' : '7. Account Termination', body: lang === 'hi' ? 'हम किसी भी समय, बिना सूचना के, उन खातों को बंद कर सकते हैं जो इन नियमों का उल्लंघन करते हैं।' : 'We reserve the right to terminate accounts that violate these terms at any time without notice.' },
            { title: lang === 'hi' ? '8. संपर्क' : '8. Contact', body: lang === 'hi' ? 'किसी भी प्रश्न के लिए guptaarpit.tech@gmail.com पर संपर्क करें।' : 'For any questions, contact us at support@progressivenaari.com' }
          ].map(section => (
            <div key={section.title} className="mb-6">
              <h2 className="font-semibold text-gray-800 text-lg mb-2">{section.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
