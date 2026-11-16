# 📈 Market Pulse AI Terminal & Bot – 100% Permanent Hosting & Fixed Links Guide

---

## 🎯 1. काय समस्या होती आणि ती कशी कायमस्वरूपी (100% Permanent) सोडवली? (Root Cause & Fix)

1. **लिंक्स वारंवार का बदलत होत्या? (Why links were changing):**
   - क्लाउडफ्लेअर क्विक टनेल (`trycloudflare.com`) प्रत्येक वेळी नवीन यादृच्छिक (random) लिंक तयार करत होते.
   - बॅकग्राउंडमध्ये एकापेक्षा जास्त वॉचडॉग प्रोसेस एकाच वेळी सुरू राहिल्यामुळे पोर्ट ५००० वर संघर्ष (conflict) होत होता.
   - क्लाउडफ्लेअरने वारंवार रिक्वेस्ट्समुळे **Status 429 (Too Many Requests)** एरर दिली होती, ज्यामुळे टनेल क्रॅश लूपमध्ये अडकले होते.

2. **कायमस्वरूपी तोडगा (Permanent Solution Applied):**
   - **फिक्स सबडोमेन टनेल (Fixed Subdomain):** आता कायमस्वरूपी फिक्स लिंक **`https://market-pulse-terminal.loca.lt`** सेट केली आहे. रीस्टार्ट किंवा रीबूट झाल्यावरही **ही लिंक बदलत नाही**!
   - **सिंगल-इन्स्टन्स प्रोटेक्शन (Single-Instance Mutex):** वॉचडॉग आणि टनेलच्या डुप्लिकेट प्रोसेसेस एकाच वेळी सुरू होऊ शकत नाहीत.
   - **ऑटो-हिलिंग व हेल्थ चेक:** सर्व्हर आणि टनेल बॅकग्राउंडमध्ये सुरळीत सुरू राहतील.
   - **डेस्कटॉप ऑटो-लाँचर फाईल्स (Desktop Launchers):** तुमच्या डेस्कटॉपवर फिक्स लाँचर फाईल तयार केली आहे, ज्यावर क्लिक करताच थेट लाईव्ह पोर्टल उघडते.

---

## 🌐 2. तुमच्या कायमस्वरूपी लिंक्स (100% Permanent Access Links)

| ऍक्सेस प्रकार | कायमस्वरूपी लिंक (Permanent Link) | वैशिष्ट्ये |
| :--- | :--- | :--- |
| 💻 **Local PC** | **`http://localhost:5000`** | कम्प्युटरवर झिरो लॅग, इंटरनेटशिवाय चालते |
| 📱 **Mobile Wi-Fi** | **`http://192.168.101.6:5000`** | घरात/ऑफिसमध्ये त्याच वाय-फायवरून मोबाईलवर झिरो डेटा |
| 🌍 **Public Fixed Tunnel** | **`https://market-pulse-terminal.loca.lt`** | **कधीही लिंक बदलत नाही!** 4G/5G वर जगातून कुठूनही चालते |
| ⚡ **Desktop Launcher** | **`MARKET_PORTAL_PERMANENT.html`** | डेस्कटॉपवरून १-क्लिकवर थेट पोर्टल ओपन होते |

---

## 📁 3. डेस्कटॉपवरील १-क्लिक मॅनेजमेंट टूल्स (Desktop Shortcuts)

* **`MARKET_PORTAL_PERMANENT.html`** – १-क्लिक कायमस्वरूपी लाँचर (थेट लाईव्ह पोर्टल उघडते).
* **`MARKET MOBILE DASHBOARD.url`** – मोबाईलसाठी फिक्स टनेल लिंक थेट ओपन करते.
* **`MARKET PULSE BOT DASHBOARD.url`** – लोकल पीसी डॅशबोर्ड (`http://localhost:5000`).
* **`CHECK MARKET BOT STATUS.bat`** – बॉट व सर्व्हरचे लाईव्ह स्टेटस आणि लिंक्स पाहण्यासाठी.
* **`START MARKET BOT.bat`** – बॉट बॅकग्राउंडमध्ये सुरू करण्यासाठी.
* **`RESTART MARKET BOT.bat`** – ३ सेकंदात पूर्ण सिस्टीम रीस्टार्ट करण्यासाठी.
* **`STOP MARKET BOT.bat`** – सर्व प्रोसेसेस स्वच्छ बंद करण्यासाठी.

---

## ☁️ 4. क्लाउड २४/७ होस्टिंग (PC पूर्ण बंद असतानाही कायमस्वरूपी चालवण्यासाठी)

जर तुम्हाला तुमचा कॉम्प्युटर बंद ठेवूनही हे टर्मिनल २४ तास चालू ठेवायचे असेल, तर **Render.com** वर मोफत होस्ट करा:

### स्टेप्स (Render.com Free Cloud Hosting):
1. [Render.com](https://render.com) वर मोफत अकाउंट तयार करा.
2. **New +** वर क्लिक करून **Web Service** निवडा.
3. हे GitHub repository कनेक्ट करा (किंवा Deploy from Git repo).
4. सेटिंग्ज भरा:
   - **Name:** `share-market-portal`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Health Check Path:** `/health`
   - **Plan:** `Free`
5. **Deploy Web Service** वर क्लिक करा.
6. Render तुम्हाला **`https://share-market-portal.onrender.com`** ही कायमस्वरूपी लिंक देईल, जी कॉम्प्युटर बंद असतानाही २४ तास अखंडित चालू राहील!
