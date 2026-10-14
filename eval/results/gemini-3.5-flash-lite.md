# Eval sonucu: gemini-3.5-flash-lite

- Mod: `llm` · Model: `gemini-3.5-flash-lite`
- Korpus: 10 gerçek ToS, 1225 cümle, 172 uzman etiketli haksız madde (CLAUDETTE)
- Birim: cümle. Yakalanan = haksız etiketli cümle, CLAUDETTE karşılığı olan bir kategoriyle işaretlendi.

| Metrik | Değer |
|---|---|
| Yakalanan (TP) | 58 |
| Kaçırılan (FN) | 114 |
| Yanlış alarm (FP) | 12 |
| Precision | 82.9% |
| Recall | 33.7% |
| F1 | 47.9% |
| Yakalananlarda kategori de doğru | 55/58 |
| Taksonomi dışı işaret (veri paylaşımı, otomatik yenileme vb.; skora katılmaz) | 14 (bunlardan 1 tanesi zaten haksız etiketli cümle) |
| Düşük güvenli bulgular dahil edilirse P / R / F1 | 82.9% / 33.7% / 47.9% |

### Doğrulama katmanı

| | |
|---|---|
| Modelin önerdiği bulgu | 85 |
| Alıntısı doğrulanamadığı için reddedilen | 0 (0.0%) |
| Düşük güven (<0.6) nedeniyle skordan ayrılan | 0 |
| LLM çağrısı / onarım denemesi / başarısız parça | 14 / 0 / 0 |
| Token (girdi / çıktı) | 59934 / 10296 |
| Toplam model süresi | 38 sn |

### Kategori bazında

| Kod | Kategori | TP | FP | FN | P | R | F1 |
|---|---|---|---|---|---|---|---|
| A | Zorunlu tahkim / dava hakkından feragat | 6 | 2 | 3 | 75.0% | 66.7% | 70.6% |
| CH | Şartların tek taraflı değiştirilmesi | 12 | 4 | 15 | 75.0% | 44.4% | 55.8% |
| CR | İçeriğin tek taraflı kaldırılması | 1 | 0 | 13 | 100.0% | 7.1% | 13.3% |
| J | Uzak / tek taraflı yetkili mahkeme | 6 | 1 | 6 | 85.7% | 50.0% | 63.2% |
| LAW | Yabancı hukukun uygulanması | 8 | 0 | 6 | 100.0% | 57.1% | 72.7% |
| LTD | Sorumluluğun sınırlandırılması | 11 | 7 | 35 | 61.1% | 23.9% | 34.4% |
| TER | Hesabın tek taraflı kapatılması | 4 | 0 | 27 | 100.0% | 12.9% | 22.9% |
| USE | Kullanarak kabul sayılma | 7 | 1 | 19 | 87.5% | 26.9% | 41.2% |
| PINC | Kullanarak gizlilik politikasını kabul | 1 | 0 | 7 | 100.0% | 12.5% | 22.2% |

## Belge bazında

### Google — yakalanan 6, kaçırılan 7, yanlış alarm 1

<details><summary>Yakalanan</summary>

- **S4** altın: USE · tahmin: USE — by using our services, you are agreeing to these terms.
- **S32** altın: USE,PINC · tahmin: PINC — by using our services, you agree that google can use such data in accordance with our privacy policies.
- **S75** altın: LTD · tahmin: LTD — to the extent permitted by law, the total liability of google, and its suppliers and distributors, for any claims under these terms, including for any implied warranties, is limite…
- **S79** altın: CH · tahmin: CH — we may modify these terms or any additional terms that apply to a service to, for example, reflect changes to the law or changes to our services.
- **S91** altın: LAW · tahmin: LAW — the laws of california, u.s.a., excluding california's conflict of laws rules, will apply to any disputes arising out of or relating to these terms or the services.
- **S92** altın: J · tahmin: J — all claims arising out of or relating to these terms or the services will be litigated exclusively in the federal or state courts of santa clara county, california, usa, and you an…

</details>

**Kaçırılan**

- **S11** (TER) — we may suspend or stop providing our services to you if you do not comply with our terms or policies or if we are investigating suspected misconduct.
- **S61** (CH) — we may add or remove functionalities or features.
- **S62** (TER) — and we may suspend or stop a service altogether.
- **S64** (TER) — google may also stop providing services to you, or add or create new limits to our services at any time.
- **S74** (LTD) — when permitted by law, google, and google's suppliers and distributors, will not be responsible for lost profits, revenues, or data, financial losses or indirect, special, conseque…
- **S76** (LTD) — in all cases, google, and its suppliers and distributors, will not be liable for any loss or damage that is not reasonably foreseeable.
- **S80** (CH) — you should look at the terms regularly.

**Yanlış alarm**

- **S73** (tahmin: LTD) — to the extent permitted by law, we exclude all warranties.

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S39** (content_license) — when you upload, submit, store, send or receive content to or through our services, you give google (and those we work with) a worldwide license to use, host, store, reproduce, mod…

</details>

### Netflix — yakalanan 3, kaçırılan 3, yanlış alarm 0

<details><summary>Yakalanan</summary>

- **S35** altın: CH · tahmin: CH — we may change our service plans and the price of our service from time to time; however, any price changes or changes to our service plans will apply to you no earlier than 30 days…
- **S74** altın: LAW · tahmin: LAW — these terms of use shall be governed by and construed in accordance with the laws of the netherlands.
- **S83** altın: CH · tahmin: CH — netflix may, from time to time, change these terms of use.

</details>

**Kaçırılan**

- **S12** (TER) — we reserve the right to revoke the free trial and put your account on hold in the event that we determine that you are not eligible.
- **S45** (CH) — netflix regularly makes changes to the service, including the content library.
- **S55** (TER) — we may terminate or restrict your use of our service if you violate these terms of use or are engaged in illegal or fraudulent use of the service.

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S7** (auto_renewal) — unless you cancel your membership before your monthly billing date, you authorize us to charge your next month's membership fee to your payment method (see "cancellation" below).
- **S28** (cancellation_refund) — to the extent permitted by the applicable law, payments are non-refundable and we do not provide refunds or credits for any partial-month membership periods or unwatched netflix co…

</details>

### Dropbox — yakalanan 5, kaçırılan 13, yanlış alarm 1

<details><summary>Yakalanan</summary>

- **S6** altın: USE,PINC · tahmin: USE — by using our services, you're agreeing to be bound by these terms, our privacy policy and acceptable use policy.
- **S51** altın: CH · tahmin: CH — we may change the fees in effect but will give you advance notice of these changes via a message to the email address associated with your account.
- **S74** altın: LTD · tahmin: LTD — in countries where exclusions or limitations of liability are allowed, dropbox, its affiliates, suppliers or distributors won't be liable for: i) any indirect, special, incidental,…
- **S89** altın: A · tahmin: A — you and dropbox agree to resolve any claims relating to these terms or the services through final and binding arbitration by a single arbitrator, except as set forth under exceptio…
- **S116** altın: CH · tahmin: CH — we may revise these terms from time to time to better reflect: (a) changes to the law, (b) new regulatory requirements, or (c) improvements or enhancements made to our services.

</details>

**Kaçırılan**

- **S39** (CR,TER) — we reserve the right to delete or disable content alleged to be infringing and terminate accounts of repeat infringers.
- **S50** (CH,TER) — if you don't pay for your paid account on time, we reserve the right to suspend it or reduce your storage to free space levels.
- **S59** (TER) — we reserve the right to suspend or terminate your access to the services with notice to you if: (a) you're in breach of these terms, (b) you're using the services in a manner that …
- **S61** (TER) — if after such notice you fail to take the steps we ask of you, we'll terminate or suspend your access to the services.
- **S62** (TER) — we won't provide notice before termination where: (a) you're in material breach of these terms, (b) doing so would cause us legal liability or compromise our ability to provide the…
- **S72** (LTD) — in countries where the following types of exclusions aren't allowed, we're responsible to you only for losses and damages that are a reasonably foreseeable result of our failure to…
- **S75** (LTD) — these exclusions or limitations will apply regardless of whether or not dropbox or any of its affiliates has been warned of the possibility of such damages.
- **S78** (LTD) — other than for the types of liability we can not limit by law (as described in this section), we limit our liability to you to the greater of $ 20 usd or 100% of any amount you've …
- **S84** (J) — you and dropbox agree that any judicial proceeding to resolve claims relating to these terms or the services will be brought in the federal or state courts of san francisco county,…
- **S85** (J) — both you and dropbox consent to venue and personal jurisdiction in such courts.
- **S103** (J) — if the agreement to arbitrate is found not to apply to you or your claim, you agree to the exclusive jurisdiction of the state and federal courts in san francisco county, californi…
- **S107** (LAW) — these terms will be governed by california law except for its conflicts of laws principles.
- **S121** (USE) — by continuing to use or access the services after the updates come into effect, you agree to be bound by the revised terms.

**Yanlış alarm**

- **S104** (tahmin: A) — you may only resolve disputes with us on an individual basis, and may not bring a claim as a plaintiff or a class member in a class, consolidated, or representative action.

### Pinterest — yakalanan 7, kaçırılan 15, yanlış alarm 0

<details><summary>Yakalanan</summary>

- **S4** altın: USE,PINC · tahmin: USE — by accessing or using pinterest, you agree to be bound by these terms, our privacy policy, our cookies policy and our community guidelines.
- **S75** altın: LTD · tahmin: LTD — to the maximum extent permitted by law, pinterest shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, …
- **S86** altın: A · tahmin: A — if pinterest hasn't been able to resolve the dispute with you informally, we each agree to resolve any claim, dispute, or controversy (excluding claims for injunctive or other equi…
- **S90** altın: A · tahmin: A — you agree that, by agreeing to these terms of service, the u.s. federal arbitration act governs the interpretation and enforcement of this provision, and that you and pinterest are…
- **S106** altın: LAW · tahmin: LAW — these terms shall be governed by the laws of the state of california, without respect to its conflict of laws principles.
- **S107** altın: J,LAW · tahmin: J — if you are not a consumer in the eea, the exclusive place of jurisdiction for all disputes arising from or in connection with this agreement is san francisco county, california, or…
- **S116** altın: CH · tahmin: CH — we may revise these terms from time to time and the most current version will always be posted on our website.

</details>

**Kaçırılan**

- **S33** (CR) — we reserve the right to remove or modify user content, or change the way it's used in pinterest, for any reason.
- **S34** (CR) — this includes user content that we believe violates these terms, our community guidelines, or any other policies.
- **S59** (TER) — pinterest may terminate or suspend your right to access or use pinterest for any reason on appropriate notice.
- **S60** (TER) — we may terminate or suspend your access immediately and without notice if we have a good reason, including any violation of our community guidelines.
- **S76** (LTD) — in no event shall pinterest's aggregate liability for all claims relating to the service exceed one hundred u.s. dollars (u.s. $ 100.00).
- **S78** (LTD) — instead, pinterest's liability will be limited to foreseeable damages arising due to a breach of material contractual obligations typical for this type of contract.
- **S79** (LTD) — pinterest isn't liable for damages that result from a non-material breach of any other applicable duty of care.
- **S80** (LTD) — this limitation of liability won't apply to any statutory liability that can not be limited, to liability for death or personal injury caused by our negligence or willful misconduc…
- **S82** (LTD) — we're not liable for various things.
- **S91** (A) — the arbitrator has exclusive authority to resolve any dispute relating to the interpretation, applicability, or enforceability of this binding arbitration agreement.
- **S93** (A) — any arbitration will be administered by the american arbitration association ("aaa") under the consumer arbitration rules then in effect for the aaa, except as provided herein.
- **S98** (A) — if your claim exceeds $ 10,000, the right to a hearing will be determined by the aaa rules.
- **S118** (USE) — by continuing to access or use pinterest after revisions become effective, you agree to be bound by the new terms.
- **S119** (USE) — if you don't agree to the new terms, please stop using pinterest.
- **S127** (PINC) — these terms, together with the privacy policy and any amendments and any additional agreements you may enter into with pinterest shall constitute the entire agreement between you a…

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S31** (content_license) — you grant pinterest and our users a non-exclusive, royalty-free, transferable, sublicensable, worldwide license to use, store, display, reproduce, save, modify, create derivative w…

</details>

### WhatsApp — yakalanan 7, kaçırılan 7, yanlış alarm 2

<details><summary>Yakalanan</summary>

- **S4** altın: USE · tahmin: USE — you agree to our terms of service ("terms") by installing, accessing, or using our apps, services, features, software, or website (together, "services").
- **S8** altın: A · tahmin: A — if you are a whatsapp user located in the united states or canada, our terms contain a binding arbitration provision, which states that, except if you opt out and except for certai…
- **S58** altın: LTD · tahmin: LTD — our aggregate liability relating to, arising out of, or in any way in connection with our terms, us, or our services will not exceed the greater of one hundred dollars ($ 100) or t…
- **S66** altın: J · tahmin: J — if you are not subject to the "special arbitration provision for united states or canada users" section below, you agree that you will resolve any claim you have with us relating t…
- **S67** altın: LAW · tahmin: LAW — the laws of the state of california govern our terms, as well as any disputes, whether in court or arbitration, which might arise between whatsapp and you, without regard to confli…
- **S72** altın: CH,TER · tahmin: TER — we may modify, suspend, or terminate your access to or use of our services anytime for any reason, such as if you violate the letter or spirit of our terms or create harm, risk, or…
- **S87** altın: USE · tahmin: CH — your continued use of our services confirms your acceptance of our terms, as amended.

</details>

**Kaçırılan**

- **S24** (USE,PINC) — you agree to our data practices, including the collection, use, processing, and sharing of your information as described in our privacy policy, as well as the transfer and processi…
- **S49** (TER) — we may terminate your whatsapp account if you repeatedly infringe the intellectual property rights of others.
- **S57** (LTD) — the whatsapp parties will not be liable to you for any lost profits or consequential, special, punitive, indirect, or incidental damages relating to, arising out of, or in any way …
- **S59** (LTD) — the foregoing disclaimer of certain damages and limitation of liability will apply to the maximum extent permitted by applicable law.
- **S61** (LTD) — notwithstanding anything to the contrary in our terms, in such cases, the liability of the whatsapp parties will be limited to the fullest extent permitted by applicable law.
- **S70** (TER) — we may discontinue some or all of our services, including certain features and the support for certain devices and platforms, at any time.
- **S85** (CH) — we may amend or update these terms.

**Yanlış alarm**

- **S51** (tahmin: LTD) — we are providing our services on an "as is" basis without any express or implied warranties, including, but not limited to, warranties of merchantability, fitness for a particular …
- **S62** (tahmin: LTD) — you agree to defend, indemnify, and hold harmless the whatsapp parties from and against all liabilities, damages, losses, and expenses of any kind (including reasonable legal fees …

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S24** (data_sharing) [altın: haksız] — you agree to our data practices, including the collection, use, processing, and sharing of your information as described in our privacy policy, as well as the transfer and processi…
- **S41** (content_license) — in order to operate and provide our services, you grant whatsapp a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, cr…

</details>

### Reddit — yakalanan 6, kaçırılan 17, yanlış alarm 1

<details><summary>Yakalanan</summary>

- **S8** altın: USE · tahmin: USE — by accessing or using our services, you agree to be bound by these terms.
- **S21** altın: CH,TER · tahmin: CH — we reserve the right to modify, suspend, or discontinue the services (in whole or in part) at any time, with or without notice to you.
- **S93** altın: LTD · tahmin: LTD — in no event and under no theory of liability, including contract, tort, negligence, strict liability, warranty, or otherwise, will the reddit entities be liable to you for any indi…
- **S100** altın: J,LAW · tahmin: J,LAW — except for the government entities listed below: any claims arising out of or relating to these terms or the services will be governed by the laws of california, other than its con…
- **S108** altın: USE · tahmin: CH — by continuing to access or use the services on or after the effective date of the revised terms, you agree to be bound by the revised terms.
- **S117** altın: TER · tahmin: TER — we may suspend or terminate your accounts, status as a moderator, or ability to access or use the services at any time for any or no reason, including for a violation of these term…

</details>

**Kaçırılan**

- **S9** (USE) — if you do not agree to these terms, you may not access or use our services.
- **S22** (CH) — any future release, update, or other addition to functionality of the services will be subject to these terms, which may be updated from time to time.
- **S23** (LTD) — you agree that we will not be liable to you or to any third party for any modification, suspension, or discontinuation of the services or any part thereof.
- **S37** (CR) — you also agree that we may remove metadata associated with your content, and you irrevocably waive any claims and assertions of moral rights or attribution with respect to your con…
- **S39** (CR) — although we have no obligation to screen, edit, or monitor your content, we may, in our sole discretion, delete or remove your content at any time and for any reason, including for…
- **S73** (CR,TER) — we have a policy that includes the removal of any infringing materials from the services and for the termination, in appropriate circumstances, of users of our services who are rep…
- **S77** (CR) — if we remove your content in response to a copyright or trademark notice, we will notify you via reddit's private messaging system.
- **S94** (LTD) — access to, and use of, the services is at your own discretion and risk, and you will be solely responsible for any damage to your device or computer system, or loss of data resulti…
- **S95** (LTD) — in no event will the aggregate liability of the reddit entities exceed the greater of one hundred u.s. dollars ($ 100) or any amount you paid reddit in the previous six months for …
- **S96** (LTD) — the limitations of this section will apply to any theory of liability, including those based on warranty, contract, statute, tort (including negligence) or otherwise, and even if t…
- **S97** (LTD) — the foregoing limitation of liability will apply to the fullest extent permitted by law in the applicable jurisdiction.
- **S103** (LAW) — to the extent permitted by federal law, the laws of california (other than its conflict of law rules) will apply in the absence of applicable federal law.
- **S104** (J,LAW) — all disputes related to these terms or the services will be brought solely in the federal or state courts located in san francisco, california.
- **S105** (CH) — we may make changes to these terms from time to time.
- **S106** (CH) — if we make changes, we will post the amended terms to our services and update the effective date above.
- **S107** (CH) — if the changes, in our sole discretion, are material, we may also notify you by sending an email to the address associated with your account (if you have chosen to provide an email…
- **S109** (USE) — if you do not agree to the revised terms, you must stop accessing and using our services before the changes become effective.

**Yanlış alarm**

- **S87** (tahmin: LTD) — except to the extent prohibited by law, you agree to defend, indemnify, and hold us, our licensors, our third party service providers and our officers, employees, licensors, and ag…

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S35** (content_license) — when your content is created with or submitted to the services, you grant us a worldwide, royalty-free, perpetual, irrevocable, non-exclusive, transferable, and sublicensable licen…

</details>

### YouTube — yakalanan 6, kaçırılan 12, yanlış alarm 3

<details><summary>Yakalanan</summary>

- **S14** altın: CH · tahmin: CH — youtube reserves the right to make changes the terms from time to time, for example to address changes to the law or regulatory changes or changes to functionality offered through …
- **S46** altın: CH · tahmin: CH — you acknowledge and agree that the form and nature of the service which youtube provides may change from time to time without prior notice to you.
- **S65** altın: CR,TER · tahmin: CR — 7.8 on becoming aware of any potential violation of these terms, youtube reserves the right (but shall have no obligation) to decide whether content complies with the content requi…
- **S97** altın: LTD · tahmin: LTD — 13.2 subject to the overall provision in paragraph 13.1 above youtube shall not be liable to you for: a. any indirect or consequential losses which may be incurred by you.
- **S111** altın: LAW · tahmin: LAW — 14.6 the terms, and your relationship with youtube under the terms, shall be governed by english law.
- **S112** altın: J · tahmin: J — you and youtube agree to submit to the exclusive jurisdiction of the courts of england to resolve any legal matter arising from the terms.

</details>

**Kaçırılan**

- **S3** (PINC) — 1.2 your legal agreement with youtube is made up of (a) the terms and conditions set out in this document, (b) youtube's privacy policy (https://www.youtube.co.uk/t/privacy) and (c…
- **S15** (CH) — therefore you must look at the terms regularly to check for such changes.
- **S18** (USE) — your continued use of the service after the date the modified terms are posted will constitute your acceptance of the modified terms.
- **S47** (TER) — 5.5 as part of this continuing innovation, you acknowledge and agree that youtube may stop (permanently or temporarily) providing the service (or any features within the service) t…
- **S53** (TER) — 6.2 as part of youtube's copyright policy, youtube will terminate user access to the / service if a user has been determined to be a repeat infringer.
- **S85** (TER) — 11.3 youtube may at any time terminate its legal agreement with you if: a.you have breached any provision of the terms (or have acted in manner which clearly shows that you do not …
- **S86** (TER) — 11.4 youtube may terminate its legal agreement with you if: youtube is transitioning to no longer providing the service to users in the country in which you are resident or from wh…
- **S98** (LTD) — this shall include; (i) any loss of profit (whether incurred directly or indirectly); (ii) any loss of goodwill or business reputation; (iii) any loss of opportunity; or (iv) any l…
- **S100** (LTD) — the deletion of, corruption of, or failure to store, any content and other communications data maintained or transmitted by or through your use of the service; iv.
- **S101** (LTD) — your failure to provide youtube with accurate account information; v. your failure to keep your password or youtube account details secure and confidential.
- **S102** (LTD) — 13.3 the limitations on youtube's liability to you in paragraph 13.2 above shall apply whether or not youtube has been advised of or should have been aware of the possibility of an…
- **S113** (J) — notwithstanding this, you agree that youtube shall still be allowed to apply for injunctive remedies (or other equivalent types of urgent legal remedy) in any jurisdiction.

**Yanlış alarm**

- **S10** (tahmin: USE) — 2.2 you can accept the terms by simply using the service.
- **S89** (tahmin: LTD) — 12.2 the service is provided "as is" and youtube makes no warranty or representation to you with respect to them.
- **S105** (tahmin: CH) — 14.2 you agree that youtube may provide you with notices, including those regarding changes to the terms, by email, regular mail, or postings on the service.

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S69** (content_license) — a. to youtube, a worldwide, non-exclusive, royalty-free, transferable licence (with right to sub-licence) to use, reproduce, distribute, prepare derivative works of, display, and p…

</details>

### Facebook — yakalanan 4, kaçırılan 9, yanlış alarm 1

<details><summary>Yakalanan</summary>

- **S82** altın: USE · tahmin: CH — your continued use of the facebook services, following notice of the changes to our terms, policies or guidelines, constitutes your acceptance of our amended terms, policies or gui…
- **S87** altın: J · tahmin: J — you will resolve any claim, cause of action or dispute (claim) you have with us arising out of or relating to this statement or facebook exclusively in the u.s. district court for …
- **S88** altın: LAW · tahmin: LAW — the laws of the state of california will govern this statement, as well as any claim that might arise between you and us, without regard to conflict of law provisions.
- **S99** altın: LTD · tahmin: LTD — our aggregate liability arising out of this statement or facebook will not exceed the greater of one hundred dollars ($ 100) or the amount you have paid us in the past twelve month…

</details>

**Kaçırılan**

- **S7** (USE) — by using or accessing the facebook services, you agree to this statement, as updated from time to time in accordance with section 13 below.
- **S48** (CR) — if you select a username or similar identifier for your account or page, we reserve the right to remove or reclaim it if we believe it is appropriate (such as when a trademark owne…
- **S51** (CR) — we can remove any content or information you post on facebook if we believe that it violates this statement or our policies.
- **S55** (TER) — if you repeatedly infringe other people's intellectual property rights, we will disable your account when appropriate.
- **S64** (USE) — if you make a payment on facebook, you agree to our payments terms unless it is stated that other terms apply.
- **S83** (TER) — if you violate the letter or spirit of this statement, or otherwise create risk or possible legal exposure for us, we can stop providing all or part of facebook to you.
- **S98** (LTD) — we will not be liable to you for any lost profits or other consequential, special, indirect, or incidental damages arising out of or in connection with this statement or facebook, …
- **S101** (LTD) — in such cases, facebook's liability will be limited to the fullest extent permitted by applicable law.
- **S133** (USE) — by using or accessing facebook services, you agree that we can collect and use such content and information in accordance with the data policy as amended from time to time.

**Yanlış alarm**

- **S89** (tahmin: LTD) — if anyone brings a claim against us related to your actions, content or information on facebook, you will indemnify and hold us harmless from and against all damages, losses, and e…

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S15** (content_license) — for content that is covered by intellectual property rights, like photos and videos (ip content), you specifically give us the following permission, subject to your privacy and app…

</details>

### Uber — yakalanan 9, kaçırılan 5, yanlış alarm 1

<details><summary>Yakalanan</summary>

- **S4** altın: USE · tahmin: USE — your access and use of the services constitutes your agreement to be bound by these terms, which establishes a contractual relationship between you and uber.
- **S7** altın: TER · tahmin: TER — uber may immediately terminate these terms or any services with respect to you, or generally cease offering or deny access to the services or any portion thereof, at any time for a…
- **S11** altın: CH · tahmin: CH — uber may amend the terms related to the services from time to time.
- **S72** altın: CH · tahmin: CH — as between you and uber, uber reserves the right to establish, remove and/or revise charges for any or all services or goods obtained through the use of the services at any time in…
- **S91** altın: LTD · tahmin: LTD — uber shall not be liable for indirect, incidental, special, exemplary, punitive or consequential damages, including lost profits, lost data, personal injury or property damage rela…
- **S92** altın: LTD · tahmin: LTD — uber shall not be liable for any damages, liability or losses arising out of: (i) your use of or reliance on the services or your inability to access or use the services; or (ii) a…
- **S95** altın: LTD · tahmin: LTD — in no event shall uber's total liability to you in connection with the services for all damages, losses and causes of action exceed five hundred euros ($ 500).
- **S99** altın: LAW · tahmin: LAW — except as otherwise set forth in these terms, these terms shall be exclusively governed by and construed in accordance with the laws of the netherlands, excluding its rules on conf…
- **S101** altın: A · tahmin: A — any dispute, conflict, claim or controversy arising out of or broadly in connection with or relating to the services or these terms, including those relating to its validity, its c…

</details>

**Kaçırılan**

- **S13** (USE) — your continued access or use of the services after such posting constitutes your consent to be bound by the terms, as amended.
- **S27** (LTD) — uber does not endorse such third party services and content and in no event shall uber be responsible or liable for any products or services of such third party providers.
- **S57** (CR) — uber may, but shall not be obligated to, review, monitor, or remove user content, at uber's sole discretion and at any time and for any reason, without notice to you.
- **S93** (LTD) — uber shall not be liable for delay or failure in performance resulting from causes beyond uber's reasonable control.
- **S96** (LTD) — uber's services may be used by you to request and schedule transportation, goods or logistics services with third party providers, but you agree that uber has no responsibility or …

**Yanlış alarm**

- **S98** (tahmin: LTD) — you agree to indemnify and hold uber and its officers, directors, employees and agents harmless from any and all claims, demands, losses, liabilities, and expenses (including attor…

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S54** (content_license) — however, by providing user content to uber, you grant uber a worldwide, perpetual, irrevocable, transferrable, royalty-free license, with the right to sublicense, to use, copy, mod…
- **S67** (cancellation_refund) — charges paid by you are final and non-refundable, unless otherwise determined by uber.

</details>

### Tinder — yakalanan 5, kaçırılan 26, yanlış alarm 2

<details><summary>Yakalanan</summary>

- **S9** altın: USE,PINC · tahmin: USE — by creating a tinder account or by using the tinder imessage app ("tinder stacks"), whether through a mobile device, mobile application or computer (collectively, the "service") yo…
- **S11** altın: CH · tahmin: CH — we may make changes to this agreement and to the services from time to time.
- **S36** altın: TER · tahmin: TER — tinder may terminate your account at any time without notice if it believes that you have violated this agreement.
- **S165** altın: LTD · tahmin: LTD — to the fullest extent permitted by applicable law, in no event will tinder, its affiliates, employees, licensors or service providers be liable for any indirect, consequential, exe…
- **S170** altın: A · tahmin: A — the exclusive means of resolving any dispute or claim arising out of or relating to this agreement (including any alleged breach thereof) or the service shall be binding arbitratio…

</details>

**Kaçırılan**

- **S10** (USE) — if you do not accept and agree to be bound by all of the terms of this agreement, please do not use the service.
- **S13** (CH) — the most recent version of this agreement will be posted on the services under settings and also on gotinder.com, and you should regularly check for the most recent version.
- **S16** (USE) — if you continue to use the services after the changes become effective, then you agree to the revised agreement.
- **S34** (CH) — this means we may add new product features or enhancements from time to time as well as remove some features, and if these actions do not materially affect your rights or obligatio…
- **S40** (LTD) — though tinder strives to encourage a respectful user experience through features like the double opt-in that only allows users to communicate if they have both indicated interest i…
- **S65** (TER) — the company may investigate and take any available legal action in response to illegal and / or unauthorized uses of the service, including termination of your account.
- **S73** (CR) — we may delete any content, in whole or in part, that in our sole judgment violates this agreement or may harm the reputation of the service.
- **S75** (TER) — if we feel that your behavior towards any of our customer care representatives or other employees is at any time threatening or offensive, we reserve the right to immediately termi…
- **S90** (TER) — tinder reserves the right to investigate and / or terminate your account without a refund of any purchases if you have misused the service or behaved in a way that tinder regards a…
- **S91** (CR,LTD) — although tinder reserves the right to review and remove content that violates this agreement, such content is the sole responsibility of the user who posts it, and tinder can not g…
- **S102** (TER) — if you initiate a chargeback or otherwise reverse a payment made with your payment method, tinder may terminate your account immediately in its sole discretion.
- **S121** (CR) — virtual items do not incur fees for non-use, however, the license granted to you in virtual items will terminate in accordance with the terms of this agreement, when tinder ceases …
- **S122** (CH) — tinder, in its sole discretion, reserves the right to charge fees for the right to access or use virtual items and / or may distribute virtual items with or without charge.
- **S123** (CH) — tinder may manage, regulate, control, modify or eliminate virtual items at any time.
- **S124** (LTD) — tinder shall have no liability to you or any third party in the event that tinder exercises any such rights.
- **S128** (USE) — the provision of virtual items for use in the service is a service provided by tinder that commences immediately upon the acceptance of your purchase of such virtual items.
- **S129** (LTD) — you acknowledge that tinder is not required to provide a refund for any reason, and that you will not receive money or other compensation for unused virtual items when an account i…
- **S158** (LTD) — tinder does not represent or warrant that (a) the service will be uninterrupted, secure or error free, (b) any defects or errors in the service will be corrected, or (c) that any c…
- **S159** (LTD) — tinder takes no responsibility for any content that you or another user or third party posts, sends or receives through the services.
- **S164** (LTD) — tinder is not responsible or liable for such third parties ' terms or actions.
- **S166** (LTD) — in no event will tinder's aggregate liability to you for all claims relating to the service exceed the amount paid, if any, by you to tinder for the service while you have an accou…
- **S173** (USE) — by using the service in any manner, you agree to the above arbitration agreement.
- **S182** (J) — in the event that this arbitration agreement is for any reason held to be unenforceable, any litigation against the company (except for small-claims court actions) may be commenced…
- **S184** (LAW) — this agreement, and any dispute between you and the company, shall be governed by the laws of the state of texas without regard to principles of conflicts of law, provided that thi…
- **S187** (LAW) — for users residing in the eu or european economic area or elsewhere where our arbitration agreement is prohibited by law, the laws of texas, u.s.a., excluding texas's conflict of l…
- **S191** (PINC) — this agreement, with the privacy policy, the safety tips and any terms disclosed and agreed to by you if you purchase additional features, products or services we offer on the serv…

**Yanlış alarm**

- **S172** (tahmin: A) — but whether you choose arbitration or small-claims court, you may not under any circumstances commence or maintain against the company any class action, class arbitration, or other…
- **S189** (tahmin: J) — except for users residing in the eu or european economic area, who may bring claims in their country of residence in accordance with applicable law, all claims arising out of or re…

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S68** (content_license) — by creating an account, you grant to tinder a worldwide, transferable, sub-licensable, royalty-free, right and license to host, store, use, copy, display, reproduce, adapt, edit, p…
- **S96** (auto_renewal) — if you purchase an auto-recurring periodic subscription through an in app purchase, your iap account will be billed continuously for the subscription until you cancel.
- **S127** (cancellation_refund) — all purchases and redemptions of virtual items made through the service are final and non-refundable.

</details>
