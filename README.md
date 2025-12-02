# نظام إدارة الإنتظار - دليل الإعداد والتشغيل

## نظرة عامة

نظام إدارة الإنتظار هو تطبيق ويب متكامل مخصص للمراكز الطبية والعيادات لإدارة طوابير العملاء والمرضى بطريقة ذكية وفعالة.

## المميزات الرئيسية

- ✅ **شاشات عرض ذكية** مع دعم متعدد الشاشات
- ✅ **نداء صوتي** باللغة العربية
- ✅ **QR Code** لمتابعة الدور من الهاتف
- ✅ **حجز مواعيد** مسبق مع الأطباء
- ✅ **إدارة الأطباء** ومواعيدهم
- ✅ **تقارير وإحصائيات** مفصلة
- ✅ **واجهة عربية** كاملة
- ✅ **تصميم متجاوب** لجميع الأجهزة

## المتطلبات التقنية

### المتطلبات الأساسية
- متصفح حديث (Chrome, Firefox, Safari, Edge)
- اتصال إنترنت مستقر
- خادم ويب (اختياري للاستضافة المحلية)

### Firebase Requirements
- حساب Firebase
- Authentication (Email/Password)
- Firestore Database
- Realtime Database
- Cloud Storage (للصور)

## خطوات الإعداد

### 1. إعداد Firebase

1. **إنشاء مشروع Firebase:**
   - انتقل إلى [Firebase Console](https://console.firebase.google.com/)
   - أنشئ مشروع جديد
   - فعّل المصادقة (Authentication)
   - فعّل Firestore Database
   - فعّل Realtime Database

2. **إعداد المصادقة:**
   ```javascript
   // في Firebase Console > Authentication > Sign-in method
   // فعّل Email/Password
   ```

3. **إعداد قواعد البيانات:**

   **Firestore Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Doctors collection
       match /doctors/{doctor} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       
       // Settings collection
       match /settings/{setting} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       
       // Appointments collection
       match /appointments/{appointment} {
         allow read: if request.auth != null || request.resource.data.nationalId == resource.data.nationalId;
         allow create: if true;
         allow update: if request.auth != null;
       }
       
       // Complaints collection
       match /complaints/{complaint} {
         allow read: if request.auth != null;
         allow create: if true;
       }
       
       // VideoLinks collection
       match /videoLinks/{videoLink} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       
       // Clinics collection
       match /clinics/{clinic} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       
       // Screens collection
       match /screens/{screen} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

   **Realtime Database Rules:**
   ```javascript
   {
     "rules": {
       "queueNumbers": {
         ".read": true,
         ".write": true
       },
       "clinicStatus": {
         ".read": true,
         ".write": true
       },
       "announcements": {
         ".read": true,
         ".write": true
       },
       "currentCalls": {
         ".read": true,
         ".write": true
       },
       "videoControl": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```

### 2. تكوين ملف Firebase

عدّل ملف `firebase-config.js` وأضف معلومات مشروعك:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 3. إنشاء حساب المدير

1. انتقل إلى صفحة الإدارة (`admin.html`)
2. سجل حساب جديد باستخدام البريد الإلكتروني وكلمة المرور
3. سيتم إنشاء الحساب تلقائياً في Firebase

### 4. إعداد البيانات الأولية

#### إضافة عيادات
1. من لوحة الإدارة، انتقل إلى "إعدادات العيادات"
2. أضف العيادات مع الأرقام وكلمات السر
3. حدد الشاشة المرتبطة بكل عيادة

#### إضافة شاشات
1. من لوحة الإدارة، انتقل إلى "إعدادات الشاشات"
2. أضف الشاشات مع الأرقام وكلمات السر

#### إضافة أطباء
1. من لوحة الإدارة، انتقل إلى "الأطباء"
2. أضف بيانات الأطباء والتخصصات

## إعداد ملفات الصوت

### الطريقة الأولى: استخدام Python (موصى بها)

1. تأكد من تثبيت الحزم المطلوبة:
```bash
pip install gtts pygame
```

2. تشغيل السكربت:
```bash
python generate_audio.py
```

### الطريقة الثانية: تحميل ملفات جاهزة

إذا لم تتمكن من توليد الملفات الصوتية، يمكنك:
1. تحميل ملفات صوتية جاهزة من مصادر أخرى
2. تسميتها حسب التنسيق المطلوب
3. وضعها في مجلد `audio`

### ملفات الصوت المطلوبة

- `ding.mp3` - صوت التنبيه
- `1.mp3` إلى `200.mp3` - أرقام العملاء
- `clinic1.mp3` إلى `clinic10.mp3` - أسماء العيادات
- `instant1.mp3` إلى `instant5.mp3` - رسائل فورية

## بدء التشغيل

### التشغيل المحلي

1. تأكد من تثبيت خادم ويب (اختياري):
```bash
# باستخدام Python
python -m http.server 8000

# أو باستخدام Node.js
npx http-server

# أو باستخدام PHP
php -S localhost:8000
```

2. افتح المتصفح وانتقل إلى:
```
http://localhost:8000
```

### التشغيل على GitHub Pages

1. رفع الملفات إلى مستودع GitHub
2. فعّل GitHub Pages من إعدادات المستودع
3. سيتم نشر الموقع تلقائياً

## استخدام النظام

### للزوار/المرضى

1. **متابعة الدور:**
   - امسح QR Code للدخول إلى صفحة العميل
   - اختر العيادة
   - أدخل رقمك للمتابعة

2. **حجز موعد:**
   - انتقل إلى صفحة الاستشارات
   - اختر العيادة والطبيب
   - حدد التاريخ والوقت
   - أكد الحجز

### للموظفين

1. **لوحة التحكم:**
   - انتقل إلى صفحة التحكم
   - اختر العيادة وأدخل كلمة السر
   - استخدم الأزرار لإدارة الأرقام

### للمديرين

1. **لوحة الإدارة:**
   - انتقل إلى صفحة الإدارة
   - سجل الدخول باستخدام حساب Firebase
   - أدخل إعدادات النظام
   - أضف/عدّل العيادات والأطباء

## حل المشكلات

### مشاكل شائعة

1. **عدم الاتصال بـ Firebase:**
   - تحقق من تكوين Firebase
   - تأكد من تفعيل الخدمات المطلوبة
   - تحقق من قواعد الأمان

2. **عدم تشغيل الصوت:**
   - تأكد من وجود ملفات الصوت
   - تحقق من إعدادات المتصفح
   - تأكد من وجود مستخدمين لسماع الصوت

3. **مشاكل العرض:**
   - استخدم متصفحاً حديثاً
   - تحقق من أن JavaScript مفعّل
   - تأكد من اتصال الإنترنت

### الدعم الفني

للحصول على الدعم الفني:
- البريد الإلكتروني: support@queue-system.com
- الهاتف: +966 5XXXXXXXX
- ساعات العمل: ٢٤/٧

## الترخيص

هذا النظام مخصص للاستخدام في المراكز الطبية والعيادات.
جميع الحقوق محفوظة © 2024.

## الإصدارات المستقبلية

### المخطط للإصدار 2.0
- ✅ تطبيق جوال (iOS/Android)
- ✅ دعم اللغات المتعددة
- ✅ نظام دفع إلكتروني
- ✅ تقارير متقدمة
- ✅ API للتكامل مع أنظمة أخرى

---

**ملاحظة:** هذا الدليل يتم تحديثه باستمرار. تأكد من الرجوع إلى أحدث إصدار قبل الإعداد.