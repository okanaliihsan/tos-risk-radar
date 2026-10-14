# Eval sonucu: rules-baseline

- Mod: `rules` · Model: `rules`
- Korpus: 10 gerçek ToS, 1225 cümle, 172 uzman etiketli haksız madde (CLAUDETTE)
- Birim: cümle. Yakalanan = haksız etiketli cümle, CLAUDETTE karşılığı olan bir kategoriyle işaretlendi.

| Metrik | Değer |
|---|---|
| Yakalanan (TP) | 82 |
| Kaçırılan (FN) | 90 |
| Yanlış alarm (FP) | 84 |
| Precision | 49.4% |
| Recall | 47.7% |
| F1 | 48.5% |
| Yakalananlarda kategori de doğru | 77/82 |
| Taksonomi dışı işaret (veri paylaşımı, otomatik yenileme vb.; skora katılmaz) | 35 (bunlardan 0 tanesi zaten haksız etiketli cümle) |

### Kategori bazında

| Kod | Kategori | TP | FP | FN | P | R | F1 |
|---|---|---|---|---|---|---|---|
| A | Zorunlu tahkim / dava hakkından feragat | 7 | 54 | 2 | 11.5% | 77.8% | 20.0% |
| CH | Şartların tek taraflı değiştirilmesi | 9 | 5 | 18 | 64.3% | 33.3% | 43.9% |
| CR | İçeriğin tek taraflı kaldırılması | 4 | 0 | 10 | 100.0% | 28.6% | 44.4% |
| J | Uzak / tek taraflı yetkili mahkeme | 4 | 0 | 8 | 100.0% | 33.3% | 50.0% |
| LAW | Yabancı hukukun uygulanması | 7 | 1 | 7 | 87.5% | 50.0% | 63.6% |
| LTD | Sorumluluğun sınırlandırılması | 27 | 27 | 19 | 50.0% | 58.7% | 54.0% |
| TER | Hesabın tek taraflı kapatılması | 10 | 6 | 21 | 62.5% | 32.3% | 42.6% |
| USE | Kullanarak kabul sayılma | 8 | 2 | 18 | 80.0% | 30.8% | 44.4% |
| PINC | Kullanarak gizlilik politikasını kabul | 2 | 0 | 6 | 100.0% | 25.0% | 40.0% |

## Belge bazında

### Google — yakalanan 5, kaçırılan 8, yanlış alarm 0

<details><summary>Yakalanan</summary>

- **S32** altın: USE,PINC · tahmin: USE — by using our services, you agree that google can use such data in accordance with our privacy policies.
- **S74** altın: LTD · tahmin: LTD — when permitted by law, google, and google's suppliers and distributors, will not be responsible for lost profits, revenues, or data, financial losses or indirect, special, conseque…
- **S75** altın: LTD · tahmin: LTD — to the extent permitted by law, the total liability of google, and its suppliers and distributors, for any claims under these terms, including for any implied warranties, is limite…
- **S76** altın: LTD · tahmin: LTD — in all cases, google, and its suppliers and distributors, will not be liable for any loss or damage that is not reasonably foreseeable.
- **S79** altın: CH · tahmin: CH — we may modify these terms or any additional terms that apply to a service to, for example, reflect changes to the law or changes to our services.

</details>

**Kaçırılan**

- **S4** (USE) — by using our services, you are agreeing to these terms.
- **S11** (TER) — we may suspend or stop providing our services to you if you do not comply with our terms or policies or if we are investigating suspected misconduct.
- **S61** (CH) — we may add or remove functionalities or features.
- **S62** (TER) — and we may suspend or stop a service altogether.
- **S64** (TER) — google may also stop providing services to you, or add or create new limits to our services at any time.
- **S80** (CH) — you should look at the terms regularly.
- **S91** (LAW) — the laws of california, u.s.a., excluding california's conflict of laws rules, will apply to any disputes arising out of or relating to these terms or the services.
- **S92** (J) — all claims arising out of or relating to these terms or the services will be litigated exclusively in the federal or state courts of santa clara county, california, usa, and you an…

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S39** (content_license) — when you upload, submit, store, send or receive content to or through our services, you give google (and those we work with) a worldwide license to use, host, store, reproduce, mod…
- **S47** (tracking_profiling) — if you have a google account, we may display your profile name, profile photo, and actions you take on google or on third-party applications connected to your google account (such …
- **S54** (content_license) — google gives you a personal, worldwide, royalty-free, non-assignable and non-exclusive license to use the software provided to you by google as part of the services.

</details>

### Netflix — yakalanan 3, kaçırılan 3, yanlış alarm 2

<details><summary>Yakalanan</summary>

- **S35** altın: CH · tahmin: CH — we may change our service plans and the price of our service from time to time; however, any price changes or changes to our service plans will apply to you no earlier than 30 days…
- **S74** altın: LAW · tahmin: LAW — these terms of use shall be governed by and construed in accordance with the laws of the netherlands.
- **S83** altın: CH · tahmin: CH — netflix may, from time to time, change these terms of use.

</details>

**Kaçırılan**

- **S12** (TER) — we reserve the right to revoke the free trial and put your account on hold in the event that we determine that you are not eligible.
- **S45** (CH) — netflix regularly makes changes to the service, including the content library.
- **S55** (TER) — we may terminate or restrict your use of our service if you violate these terms of use or are engaged in illegal or fraudulent use of the service.

**Yanlış alarm**

- **S27** (tahmin: TER) — you can cancel your netflix membership at any time, and you will continue to have access to the netflix service through the end of your monthly billing period.
- **S76** (tahmin: LTD) — netflix does not accept unsolicited materials or ideas for netflix content, and is not responsible for the similarity of any of its content or programming in any media to materials…

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S28** (cancellation_refund) — to the extent permitted by the applicable law, payments are non-refundable and we do not provide refunds or credits for any partial-month membership periods or unwatched netflix co…
- **S32** (auto_renewal) — if you signed up for netflix using your account with a third party as a payment method and wish to cancel your netflix membership, you may need to do so through such third party, f…
- **S39** (content_license) — during your netflix membership we grant you a limited, non-exclusive, non-transferable, license to access the netflix service and view netflix content.

</details>

### Dropbox — yakalanan 7, kaçırılan 11, yanlış alarm 17

<details><summary>Yakalanan</summary>

- **S6** altın: USE,PINC · tahmin: PINC — by using our services, you're agreeing to be bound by these terms, our privacy policy and acceptable use policy.
- **S51** altın: CH · tahmin: CH — we may change the fees in effect but will give you advance notice of these changes via a message to the email address associated with your account.
- **S74** altın: LTD · tahmin: LTD — in countries where exclusions or limitations of liability are allowed, dropbox, its affiliates, suppliers or distributors won't be liable for: i) any indirect, special, incidental,…
- **S84** altın: J · tahmin: A — you and dropbox agree that any judicial proceeding to resolve claims relating to these terms or the services will be brought in the federal or state courts of san francisco county,…
- **S89** altın: A · tahmin: A — you and dropbox agree to resolve any claims relating to these terms or the services through final and binding arbitration by a single arbitrator, except as set forth under exceptio…
- **S103** altın: J · tahmin: A,J — if the agreement to arbitrate is found not to apply to you or your claim, you agree to the exclusive jurisdiction of the state and federal courts in san francisco county, californi…
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
- **S85** (J) — both you and dropbox consent to venue and personal jurisdiction in such courts.
- **S107** (LAW) — these terms will be governed by california law except for its conflicts of laws principles.
- **S121** (USE) — by continuing to use or access the services after the updates come into effect, you agree to be bound by the revised terms.

**Yanlış alarm**

- **S46** (tahmin: TER) — you may cancel your dropbox paid account at any time.
- **S69** (tahmin: LTD) — we also disclaim any warranties of merchantability, fitness for a particular purpose and non-infringement.
- **S87** (tahmin: A) — if you're a u.s. resident, you also agree to the following mandatory arbitration provisions:
- **S88** (tahmin: A) — we both agree to arbitrate.
- **S90** (tahmin: A) — this includes disputes arising out of or relating to interpretation or application of this "mandatory arbitration provisions" section, including its enforceability, revocability, o…
- **S91** (tahmin: A) — opt-out of agreement to arbitrate.
- **S92** (tahmin: A) — you can decline this agreement to arbitrate by clicking here and submitting the opt-out form within 30 days of first registering your account.
- **S93** (tahmin: A) — however, if you agreed to a previous version of these terms that allowed you to opt out of arbitration, your previous choice to opt out or not opt out remains binding.
- **S94** (tahmin: A) — the american arbitration association (aaa) will administer the arbitration under its commercial arbitration rules and the supplementary procedures for consumer related disputes.
- **S95** (tahmin: A) — the arbitration will be held in the united states county where you live or work, san francisco (ca), or any other location we agree to.
- **S96** (tahmin: A) — the aaa rules will govern payment of all arbitration fees.
- **S97** (tahmin: A) — dropbox will pay all arbitration fees for individual arbitration for claims less than $ 75,000.
- **S98** (tahmin: A) — if you receive an arbitration award that is more favorable than any offer we make to resolve the claim, we will pay you $ 1,000 in addition to the award.
- **S99** (tahmin: A) — dropbox will not seek its attorneys ' fees and costs in arbitration unless the arbitrator determines that your claim is frivolous.
- **S100** (tahmin: A) — exceptions to agreement to arbitrate.
- **S102** (tahmin: A) — either party may bring a lawsuit solely for injunctive relief to stop unauthorized use or abuse of the services, or intellectual property infringement (for example, trademark, trad…
- **S106** (tahmin: A) — if this specific paragraph is held unenforceable, then the entirety of this "mandatory arbitration provisions" section will be deemed void.

### Pinterest — yakalanan 14, kaçırılan 8, yanlış alarm 14

<details><summary>Yakalanan</summary>

- **S4** altın: USE,PINC · tahmin: USE — by accessing or using pinterest, you agree to be bound by these terms, our privacy policy, our cookies policy and our community guidelines.
- **S33** altın: CR · tahmin: CR — we reserve the right to remove or modify user content, or change the way it's used in pinterest, for any reason.
- **S59** altın: TER · tahmin: TER — pinterest may terminate or suspend your right to access or use pinterest for any reason on appropriate notice.
- **S60** altın: TER · tahmin: TER — we may terminate or suspend your access immediately and without notice if we have a good reason, including any violation of our community guidelines.
- **S75** altın: LTD · tahmin: LTD — to the maximum extent permitted by law, pinterest shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, …
- **S76** altın: LTD · tahmin: LTD — in no event shall pinterest's aggregate liability for all claims relating to the service exceed one hundred u.s. dollars (u.s. $ 100.00).
- **S80** altın: LTD · tahmin: LTD — this limitation of liability won't apply to any statutory liability that can not be limited, to liability for death or personal injury caused by our negligence or willful misconduc…
- **S82** altın: LTD · tahmin: LTD — we're not liable for various things.
- **S86** altın: A · tahmin: A — if pinterest hasn't been able to resolve the dispute with you informally, we each agree to resolve any claim, dispute, or controversy (excluding claims for injunctive or other equi…
- **S90** altın: A · tahmin: A — you agree that, by agreeing to these terms of service, the u.s. federal arbitration act governs the interpretation and enforcement of this provision, and that you and pinterest are…
- **S91** altın: A · tahmin: A — the arbitrator has exclusive authority to resolve any dispute relating to the interpretation, applicability, or enforceability of this binding arbitration agreement.
- **S93** altın: A · tahmin: A — any arbitration will be administered by the american arbitration association ("aaa") under the consumer arbitration rules then in effect for the aaa, except as provided herein.
- **S106** altın: LAW · tahmin: LAW — these terms shall be governed by the laws of the state of california, without respect to its conflict of laws principles.
- **S116** altın: CH · tahmin: CH — we may revise these terms from time to time and the most current version will always be posted on our website.

</details>

**Kaçırılan**

- **S34** (CR) — this includes user content that we believe violates these terms, our community guidelines, or any other policies.
- **S78** (LTD) — instead, pinterest's liability will be limited to foreseeable damages arising due to a breach of material contractual obligations typical for this type of contract.
- **S79** (LTD) — pinterest isn't liable for damages that result from a non-material breach of any other applicable duty of care.
- **S98** (A) — if your claim exceeds $ 10,000, the right to a hearing will be determined by the aaa rules.
- **S107** (J,LAW) — if you are not a consumer in the eea, the exclusive place of jurisdiction for all disputes arising from or in connection with this agreement is san francisco county, california, or…
- **S118** (USE) — by continuing to access or use pinterest after revisions become effective, you agree to be bound by the new terms.
- **S119** (USE) — if you don't agree to the new terms, please stop using pinterest.
- **S127** (PINC) — these terms, together with the privacy policy and any amendments and any additional agreements you may enter into with pinterest shall constitute the entire agreement between you a…

**Yanlış alarm**

- **S20** (tahmin: CH) — you agree that we may automatically update that software, and these terms will apply to any updates.
- **S58** (tahmin: LTD) — most of that stuff is awesome, but we're not responsible when it's not.
- **S67** (tahmin: LTD) — our service and all content on pinterest is provided on an "as is" basis without warranty of any kind, whether express or implied.
- **S68** (tahmin: LTD) — pinterest specifically disclaims any and all warranties and conditions of merchantability, fitness for a particular purpose, and non-infringement, and any warranties arising out of…
- **S87** (tahmin: A) — arbitration is a more informal way to resolve our disagreements than a lawsuit in court.
- **S88** (tahmin: A) — for instance, arbitration uses a neutral arbitrator instead of a judge or jury, involves more limited discovery, and is subject to very limited review by courts.
- **S89** (tahmin: A) — although the process is more informal, arbitrators can award the same damages and relief that a court can award.
- **S92** (tahmin: A) — this arbitration provision shall survive termination of this agreement and the termination of your pinterest account.
- **S95** (tahmin: A) — unless you and pinterest agree otherwise, the arbitration will be conducted in the county (or parish) where you reside.
- **S96** (tahmin: A) — each party will be responsible for paying any aaa filing, administrative and arbitrator fees in accordance with aaa rules, except that pinterest will pay for your reasonable filing…
- **S97** (tahmin: A) — if your claim is for $ 10,000 or less, we agree that you may choose whether the arbitration will be conducted solely on the basis of documents submitted to the arbitrator, through …
- **S99** (tahmin: A) — regardless of the manner in which the arbitration is conducted, the arbitrator shall issue a reasoned written decision explaining the essential findings and conclusions on which th…
- **S101** (tahmin: A) — all claims must be brought in the parties ' individual capacity, and not as a plaintiff or class member in any purported class or representative proceeding, and, unless we agree ot…
- **S102** (tahmin: A) — you agree that, by entering into these terms, you and pinterest are each waiving the right to a trial by jury or to participate in a class action.

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S21** (content_license) — subject to these terms and our policies (including our community guidelines), we grant you a limited, non-exclusive, non-transferable, and revocable license to use our service.
- **S31** (content_license) — you grant pinterest and our users a non-exclusive, royalty-free, transferable, sublicensable, worldwide license to use, store, display, reproduce, save, modify, create derivative w…

</details>

### WhatsApp — yakalanan 9, kaçırılan 5, yanlış alarm 6

<details><summary>Yakalanan</summary>

- **S8** altın: A · tahmin: A — if you are a whatsapp user located in the united states or canada, our terms contain a binding arbitration provision, which states that, except if you opt out and except for certai…
- **S57** altın: LTD · tahmin: LTD — the whatsapp parties will not be liable to you for any lost profits or consequential, special, punitive, indirect, or incidental damages relating to, arising out of, or in any way …
- **S58** altın: LTD · tahmin: LTD — our aggregate liability relating to, arising out of, or in any way in connection with our terms, us, or our services will not exceed the greater of one hundred dollars ($ 100) or t…
- **S59** altın: LTD · tahmin: LTD — the foregoing disclaimer of certain damages and limitation of liability will apply to the maximum extent permitted by applicable law.
- **S66** altın: J · tahmin: A,J — if you are not subject to the "special arbitration provision for united states or canada users" section below, you agree that you will resolve any claim you have with us relating t…
- **S67** altın: LAW · tahmin: A,LAW — the laws of the state of california govern our terms, as well as any disputes, whether in court or arbitration, which might arise between whatsapp and you, without regard to confli…
- **S72** altın: CH,TER · tahmin: TER — we may modify, suspend, or terminate your access to or use of our services anytime for any reason, such as if you violate the letter or spirit of our terms or create harm, risk, or…
- **S85** altın: CH · tahmin: CH — we may amend or update these terms.
- **S87** altın: USE · tahmin: CH — your continued use of our services confirms your acceptance of our terms, as amended.

</details>

**Kaçırılan**

- **S4** (USE) — you agree to our terms of service ("terms") by installing, accessing, or using our apps, services, features, software, or website (together, "services").
- **S24** (USE,PINC) — you agree to our data practices, including the collection, use, processing, and sharing of your information as described in our privacy policy, as well as the transfer and processi…
- **S49** (TER) — we may terminate your whatsapp account if you repeatedly infringe the intellectual property rights of others.
- **S61** (LTD) — notwithstanding anything to the contrary in our terms, in such cases, the liability of the whatsapp parties will be limited to the fullest extent permitted by applicable law.
- **S70** (TER) — we may discontinue some or all of our services, including certain features and the support for certain devices and platforms, at any time.

**Yanlış alarm**

- **S9** (tahmin: A) — please read the "special arbitration provision for united states or canada users" section below to learn more.
- **S53** (tahmin: LTD) — we do not control, and are not responsible for, controlling how or when our users use our services or the features, services, and interfaces our services provide.
- **S54** (tahmin: LTD) — we are not responsible for and are not obligated to control the actions or information (including content) of our users or other third parties.
- **S64** (tahmin: A) — if you are a whatsapp user located in the united states or canada, the "special arbitration provision for united states or canada users" section below applies to you.
- **S73** (tahmin: A,LTD) — the following provisions will survive any termination of your relationship with whatsapp: "licenses," "disclaimers," "limitation of liability," "indemnification," "dispute resoluti…
- **S95** (tahmin: A) — if any provision of these terms is deemed unlawful, void, or for any reason unenforceable, then that provision shall be deemed severable from our terms and shall not affect the val…

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S41** (content_license) — in order to operate and provide our services, you grant whatsapp a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, cr…
- **S42** (tracking_profiling) — the rights you grant in this license are for the limited purpose of operating and providing our services (such as to allow us to display your profile picture and status message, tr…
- **S44** (content_license) — we grant you a limited, revocable, non-exclusive, non-sublicensable, and non-transferable license to use our services, subject to and in accordance with our terms.
- **S90** (data_sharing) — all of our rights and obligations under our terms are freely assignable by us to any of our affiliates or in connection with a merger, acquisition, restructuring, or sale of assets…

</details>

### Reddit — yakalanan 11, kaçırılan 12, yanlış alarm 6

<details><summary>Yakalanan</summary>

- **S8** altın: USE · tahmin: USE — by accessing or using our services, you agree to be bound by these terms.
- **S9** altın: USE · tahmin: USE — if you do not agree to these terms, you may not access or use our services.
- **S21** altın: CH,TER · tahmin: TER — we reserve the right to modify, suspend, or discontinue the services (in whole or in part) at any time, with or without notice to you.
- **S22** altın: CH · tahmin: CH — any future release, update, or other addition to functionality of the services will be subject to these terms, which may be updated from time to time.
- **S23** altın: LTD · tahmin: LTD — you agree that we will not be liable to you or to any third party for any modification, suspension, or discontinuation of the services or any part thereof.
- **S39** altın: CR · tahmin: CR — although we have no obligation to screen, edit, or monitor your content, we may, in our sole discretion, delete or remove your content at any time and for any reason, including for…
- **S93** altın: LTD · tahmin: LTD — in no event and under no theory of liability, including contract, tort, negligence, strict liability, warranty, or otherwise, will the reddit entities be liable to you for any indi…
- **S95** altın: LTD · tahmin: LTD — in no event will the aggregate liability of the reddit entities exceed the greater of one hundred u.s. dollars ($ 100) or any amount you paid reddit in the previous six months for …
- **S97** altın: LTD · tahmin: LTD — the foregoing limitation of liability will apply to the fullest extent permitted by law in the applicable jurisdiction.
- **S100** altın: J,LAW · tahmin: LAW — except for the government entities listed below: any claims arising out of or relating to these terms or the services will be governed by the laws of california, other than its con…
- **S117** altın: TER · tahmin: TER — we may suspend or terminate your accounts, status as a moderator, or ability to access or use the services at any time for any or no reason, including for a violation of these term…

</details>

**Kaçırılan**

- **S37** (CR) — you also agree that we may remove metadata associated with your content, and you irrevocably waive any claims and assertions of moral rights or attribution with respect to your con…
- **S73** (CR,TER) — we have a policy that includes the removal of any infringing materials from the services and for the termination, in appropriate circumstances, of users of our services who are rep…
- **S77** (CR) — if we remove your content in response to a copyright or trademark notice, we will notify you via reddit's private messaging system.
- **S94** (LTD) — access to, and use of, the services is at your own discretion and risk, and you will be solely responsible for any damage to your device or computer system, or loss of data resulti…
- **S96** (LTD) — the limitations of this section will apply to any theory of liability, including those based on warranty, contract, statute, tort (including negligence) or otherwise, and even if t…
- **S103** (LAW) — to the extent permitted by federal law, the laws of california (other than its conflict of law rules) will apply in the absence of applicable federal law.
- **S104** (J,LAW) — all disputes related to these terms or the services will be brought solely in the federal or state courts located in san francisco, california.
- **S105** (CH) — we may make changes to these terms from time to time.
- **S106** (CH) — if we make changes, we will post the amended terms to our services and update the effective date above.
- **S107** (CH) — if the changes, in our sole discretion, are material, we may also notify you by sending an email to the address associated with your account (if you have chosen to provide an email…
- **S108** (USE) — by continuing to access or use the services on or after the effective date of the revised terms, you agree to be bound by the revised terms.
- **S109** (USE) — if you do not agree to the revised terms, you must stop accessing and using our services before the changes become effective.

**Yanlış alarm**

- **S41** (tahmin: LTD) — third-party content is not under our control, and we are not responsible for any of their websites, products, or services.
- **S59** (tahmin: LTD) — we are not responsible for actions taken by the moderators.
- **S83** (tahmin: CH) — reddit may change the fees or benefits associated with the premium features from time to time with reasonable advance notice; provided, however, that no advance notice will be requ…
- **S89** (tahmin: LTD) — the services are provided "as is" and "as available" without warranties of any kind, either express or implied, including, but not limited to, implied warranties of merchantability…
- **S102** (tahmin: LAW) — if you are a u.s. federal government entity: any claims arising out of or relating to these terms or the services will be governed by the laws of the united states of america witho…
- **S118** (tahmin: LTD) — the following sections will survive any termination of these terms or of your accounts: 4 (your content), 6 (things you can not do), 10 (indemnity), 11 (disclaimers), 12 (limitatio…

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S15** (content_license) — reddit grants you a personal, non-transferable, non-exclusive, revocable, limited license to use and access the services solely as permitted by these terms.
- **S35** (content_license) — when your content is created with or submitted to the services, you grant us a worldwide, royalty-free, perpetual, irrevocable, non-exclusive, transferable, and sublicensable licen…

</details>

### YouTube — yakalanan 5, kaçırılan 13, yanlış alarm 3

<details><summary>Yakalanan</summary>

- **S18** altın: USE · tahmin: CH — your continued use of the service after the date the modified terms are posted will constitute your acceptance of the modified terms.
- **S65** altın: CR,TER · tahmin: CR,TER — 7.8 on becoming aware of any potential violation of these terms, youtube reserves the right (but shall have no obligation) to decide whether content complies with the content requi…
- **S85** altın: TER · tahmin: TER — 11.3 youtube may at any time terminate its legal agreement with you if: a.you have breached any provision of the terms (or have acted in manner which clearly shows that you do not …
- **S97** altın: LTD · tahmin: LTD — 13.2 subject to the overall provision in paragraph 13.1 above youtube shall not be liable to you for: a. any indirect or consequential losses which may be incurred by you.
- **S112** altın: J · tahmin: J — you and youtube agree to submit to the exclusive jurisdiction of the courts of england to resolve any legal matter arising from the terms.

</details>

**Kaçırılan**

- **S3** (PINC) — 1.2 your legal agreement with youtube is made up of (a) the terms and conditions set out in this document, (b) youtube's privacy policy (https://www.youtube.co.uk/t/privacy) and (c…
- **S14** (CH) — youtube reserves the right to make changes the terms from time to time, for example to address changes to the law or regulatory changes or changes to functionality offered through …
- **S15** (CH) — therefore you must look at the terms regularly to check for such changes.
- **S46** (CH) — you acknowledge and agree that the form and nature of the service which youtube provides may change from time to time without prior notice to you.
- **S47** (TER) — 5.5 as part of this continuing innovation, you acknowledge and agree that youtube may stop (permanently or temporarily) providing the service (or any features within the service) t…
- **S53** (TER) — 6.2 as part of youtube's copyright policy, youtube will terminate user access to the / service if a user has been determined to be a repeat infringer.
- **S86** (TER) — 11.4 youtube may terminate its legal agreement with you if: youtube is transitioning to no longer providing the service to users in the country in which you are resident or from wh…
- **S98** (LTD) — this shall include; (i) any loss of profit (whether incurred directly or indirectly); (ii) any loss of goodwill or business reputation; (iii) any loss of opportunity; or (iv) any l…
- **S100** (LTD) — the deletion of, corruption of, or failure to store, any content and other communications data maintained or transmitted by or through your use of the service; iv.
- **S101** (LTD) — your failure to provide youtube with accurate account information; v. your failure to keep your password or youtube account details secure and confidential.
- **S102** (LTD) — 13.3 the limitations on youtube's liability to you in paragraph 13.2 above shall apply whether or not youtube has been advised of or should have been aware of the possibility of an…
- **S111** (LAW) — 14.6 the terms, and your relationship with youtube under the terms, shall be governed by english law.
- **S113** (J) — notwithstanding this, you agree that youtube shall still be allowed to apply for injunctive remedies (or other equivalent types of urgent legal remedy) in any jurisdiction.

**Yanlış alarm**

- **S60** (tahmin: LTD) — youtube does not endorse any content or any opinion, recommendation, or advice expressed therein, and youtube expressly disclaims any and all liability in connection with content.
- **S79** (tahmin: LTD) — 10.2 you acknowledge and agree that youtube is not responsible for the availability of any such external sites or resources, and does not endorse any advertising, products or other…
- **S80** (tahmin: LTD) — 10.3 you acknowledge and agree that youtube is not liable for any loss or damage which may be incurred by you as a result of the availability of those external sites or resources, …

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S69** (content_license) — a. to youtube, a worldwide, non-exclusive, royalty-free, transferable licence (with right to sub-licence) to use, reproduce, distribute, prepare derivative works of, display, and p…
- **S70** (content_license) — b. to each user of the service, a worldwide, non-exclusive, royalty-free licence to access your content through the service, and to use, reproduce, distribute, prepare derivative w…

</details>

### Facebook — yakalanan 6, kaçırılan 7, yanlış alarm 5

<details><summary>Yakalanan</summary>

- **S7** altın: USE · tahmin: USE — by using or accessing the facebook services, you agree to this statement, as updated from time to time in accordance with section 13 below.
- **S87** altın: J · tahmin: J — you will resolve any claim, cause of action or dispute (claim) you have with us arising out of or relating to this statement or facebook exclusively in the u.s. district court for …
- **S88** altın: LAW · tahmin: LAW — the laws of the state of california will govern this statement, as well as any claim that might arise between you and us, without regard to conflict of law provisions.
- **S98** altın: LTD · tahmin: LTD — we will not be liable to you for any lost profits or other consequential, special, indirect, or incidental damages arising out of or in connection with this statement or facebook, …
- **S99** altın: LTD · tahmin: LTD — our aggregate liability arising out of this statement or facebook will not exceed the greater of one hundred dollars ($ 100) or the amount you have paid us in the past twelve month…
- **S133** altın: USE · tahmin: USE — by using or accessing facebook services, you agree that we can collect and use such content and information in accordance with the data policy as amended from time to time.

</details>

**Kaçırılan**

- **S48** (CR) — if you select a username or similar identifier for your account or page, we reserve the right to remove or reclaim it if we believe it is appropriate (such as when a trademark owne…
- **S51** (CR) — we can remove any content or information you post on facebook if we believe that it violates this statement or our policies.
- **S55** (TER) — if you repeatedly infringe other people's intellectual property rights, we will disable your account when appropriate.
- **S64** (USE) — if you make a payment on facebook, you agree to our payments terms unless it is stated that other terms apply.
- **S82** (USE) — your continued use of the facebook services, following notice of the changes to our terms, policies or guidelines, constitutes your acceptance of our amended terms, policies or gui…
- **S83** (TER) — if you violate the letter or spirit of this statement, or otherwise create risk or possible legal exposure for us, we can stop providing all or part of facebook to you.
- **S101** (LTD) — in such cases, facebook's liability will be limited to the fullest extent permitted by applicable law.

**Yanlış alarm**

- **S90** (tahmin: LTD) — although we provide rules for user conduct, we do not control or direct users ' actions on facebook and are not responsible for the content or information users transmit or share o…
- **S91** (tahmin: LTD) — we are not responsible for any offensive, inappropriate, obscene, unlawful or otherwise objectionable content or information you may encounter on facebook.
- **S92** (tahmin: LTD) — we are not responsible for the conduct, whether online or offline, of any user of facebook.
- **S96** (tahmin: LTD) — facebook is not responsible for the actions, content, information, or data of third parties, and you release us, our directors, officers, employees, and agents from any claims and …
- **S100** (tahmin: LTD) — applicable law may not allow the limitation or exclusion of liability or incidental or consequential damages, so the above limitation or exclusion may not apply to you.

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S15** (content_license) — for content that is covered by intellectual property rights, like photos and videos (ip content), you specifically give us the following permission, subject to your privacy and app…
- **S71** (tracking_profiling) — this means, for example, that you permit a business or other entity to pay us to display your name and/or profile picture with your content or information, without any compensation…

</details>

### Uber — yakalanan 9, kaçırılan 5, yanlış alarm 13

<details><summary>Yakalanan</summary>

- **S4** altın: USE · tahmin: USE — your access and use of the services constitutes your agreement to be bound by these terms, which establishes a contractual relationship between you and uber.
- **S11** altın: CH · tahmin: CH — uber may amend the terms related to the services from time to time.
- **S27** altın: LTD · tahmin: LTD — uber does not endorse such third party services and content and in no event shall uber be responsible or liable for any products or services of such third party providers.
- **S57** altın: CR · tahmin: CR — uber may, but shall not be obligated to, review, monitor, or remove user content, at uber's sole discretion and at any time and for any reason, without notice to you.
- **S91** altın: LTD · tahmin: LTD — uber shall not be liable for indirect, incidental, special, exemplary, punitive or consequential damages, including lost profits, lost data, personal injury or property damage rela…
- **S92** altın: LTD · tahmin: LTD — uber shall not be liable for any damages, liability or losses arising out of: (i) your use of or reliance on the services or your inability to access or use the services; or (ii) a…
- **S93** altın: LTD · tahmin: LTD — uber shall not be liable for delay or failure in performance resulting from causes beyond uber's reasonable control.
- **S95** altın: LTD · tahmin: LTD — in no event shall uber's total liability to you in connection with the services for all damages, losses and causes of action exceed five hundred euros ($ 500).
- **S99** altın: LAW · tahmin: LAW — except as otherwise set forth in these terms, these terms shall be exclusively governed by and construed in accordance with the laws of the netherlands, excluding its rules on conf…

</details>

**Kaçırılan**

- **S7** (TER) — uber may immediately terminate these terms or any services with respect to you, or generally cease offering or deny access to the services or any portion thereof, at any time for a…
- **S13** (USE) — your continued access or use of the services after such posting constitutes your consent to be bound by the terms, as amended.
- **S72** (CH) — as between you and uber, uber reserves the right to establish, remove and/or revise charges for any or all services or goods obtained through the use of the services at any time in…
- **S96** (LTD) — uber's services may be used by you to request and schedule transportation, goods or logistics services with third party providers, but you agree that uber has no responsibility or …
- **S101** (A) — any dispute, conflict, claim or controversy arising out of or broadly in connection with or relating to the services or these terms, including those relating to its validity, its c…

**Yanlış alarm**

- **S5** (tahmin: USE) — if you do not agree to these terms, you may not access or use the services.
- **S29** (tahmin: LTD) — these third party beneficiaries are not parties to this contract and are not responsible for the provision or support of the services in any manner.
- **S69** (tahmin: CH) — uber will respond accordingly to any request from a third party provider to modify the charges for a particular service or good.
- **S76** (tahmin: TER) — you may elect to cancel your request for services or goods from a third party provider at any time prior to such third party provider's arrival, in which case you may be charged a …
- **S85** (tahmin: LTD) — disclaimers; limitation of liability; indemnity.
- **S86** (tahmin: LTD) — the services are provided "as is" and "as available."
- **S87** (tahmin: LTD) — uber disclaims all representations and warranties, express, implied or statutory, not expressly set out in these terms, including the implied warranties of merchantability, fitness…
- **S102** (tahmin: A) — if such dispute has not been settled within sixty (60) days after a request for mediation has been submitted under such icc mediation rules, such dispute can be referred to and sha…
- **S103** (tahmin: A) — the icc rules ' emergency arbitrator provisions are excluded.
- **S104** (tahmin: A) — the dispute shall be resolved by one (1) arbitrator to be appointed in accordance with the icc rules.
- **S105** (tahmin: A) — the place of both mediation and arbitration shall be amsterdam, the netherlands, without prejudice to any rights you may have under article 18 of the brussels i bis regulation (oj …
- **S106** (tahmin: A) — the language of the mediation and/or arbitration shall be english, unless you do not speak english, in which case the mediation and/or arbitration shall be conducted in both englis…
- **S107** (tahmin: A) — the existence and content of the mediation and arbitration proceedings, including documents and briefs submitted by the parties, correspondence from and to the international chambe…

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S19** (content_license) — subject to your compliance with these terms, uber grants you a limited, non-exclusive, non-sublicensable, revocable, non-transferrable license to: (i) access and use the applicatio…
- **S54** (content_license) — however, by providing user content to uber, you grant uber a worldwide, perpetual, irrevocable, transferrable, royalty-free license, with the right to sublicense, to use, copy, mod…
- **S67** (cancellation_refund) — charges paid by you are final and non-refundable, unless otherwise determined by uber.
- **S76** (cancellation_refund) — you may elect to cancel your request for services or goods from a third party provider at any time prior to such third party provider's arrival, in which case you may be charged a …
- **S84** (cancellation_refund) — such amounts will be transferred by uber to the applicable third party provider and are non-refundable.

</details>

### Tinder — yakalanan 13, kaçırılan 18, yanlış alarm 18

<details><summary>Yakalanan</summary>

- **S9** altın: USE,PINC · tahmin: PINC — by creating a tinder account or by using the tinder imessage app ("tinder stacks"), whether through a mobile device, mobile application or computer (collectively, the "service") yo…
- **S36** altın: TER · tahmin: TER — tinder may terminate your account at any time without notice if it believes that you have violated this agreement.
- **S40** altın: LTD · tahmin: LTD — though tinder strives to encourage a respectful user experience through features like the double opt-in that only allows users to communicate if they have both indicated interest i…
- **S75** altın: TER · tahmin: TER — if we feel that your behavior towards any of our customer care representatives or other employees is at any time threatening or offensive, we reserve the right to immediately termi…
- **S102** altın: TER · tahmin: TER — if you initiate a chargeback or otherwise reverse a payment made with your payment method, tinder may terminate your account immediately in its sole discretion.
- **S164** altın: LTD · tahmin: LTD — tinder is not responsible or liable for such third parties ' terms or actions.
- **S165** altın: LTD · tahmin: LTD — to the fullest extent permitted by applicable law, in no event will tinder, its affiliates, employees, licensors or service providers be liable for any indirect, consequential, exe…
- **S166** altın: LTD · tahmin: LTD — in no event will tinder's aggregate liability to you for all claims relating to the service exceed the amount paid, if any, by you to tinder for the service while you have an accou…
- **S170** altın: A · tahmin: A — the exclusive means of resolving any dispute or claim arising out of or relating to this agreement (including any alleged breach thereof) or the service shall be binding arbitratio…
- **S173** altın: USE · tahmin: A,USE — by using the service in any manner, you agree to the above arbitration agreement.
- **S182** altın: J · tahmin: A — in the event that this arbitration agreement is for any reason held to be unenforceable, any litigation against the company (except for small-claims court actions) may be commenced…
- **S184** altın: LAW · tahmin: A,LAW — this agreement, and any dispute between you and the company, shall be governed by the laws of the state of texas without regard to principles of conflicts of law, provided that thi…
- **S187** altın: LAW · tahmin: A — for users residing in the eu or european economic area or elsewhere where our arbitration agreement is prohibited by law, the laws of texas, u.s.a., excluding texas's conflict of l…

</details>

**Kaçırılan**

- **S10** (USE) — if you do not accept and agree to be bound by all of the terms of this agreement, please do not use the service.
- **S11** (CH) — we may make changes to this agreement and to the services from time to time.
- **S13** (CH) — the most recent version of this agreement will be posted on the services under settings and also on gotinder.com, and you should regularly check for the most recent version.
- **S16** (USE) — if you continue to use the services after the changes become effective, then you agree to the revised agreement.
- **S34** (CH) — this means we may add new product features or enhancements from time to time as well as remove some features, and if these actions do not materially affect your rights or obligatio…
- **S65** (TER) — the company may investigate and take any available legal action in response to illegal and / or unauthorized uses of the service, including termination of your account.
- **S73** (CR) — we may delete any content, in whole or in part, that in our sole judgment violates this agreement or may harm the reputation of the service.
- **S90** (TER) — tinder reserves the right to investigate and / or terminate your account without a refund of any purchases if you have misused the service or behaved in a way that tinder regards a…
- **S91** (CR,LTD) — although tinder reserves the right to review and remove content that violates this agreement, such content is the sole responsibility of the user who posts it, and tinder can not g…
- **S121** (CR) — virtual items do not incur fees for non-use, however, the license granted to you in virtual items will terminate in accordance with the terms of this agreement, when tinder ceases …
- **S122** (CH) — tinder, in its sole discretion, reserves the right to charge fees for the right to access or use virtual items and / or may distribute virtual items with or without charge.
- **S123** (CH) — tinder may manage, regulate, control, modify or eliminate virtual items at any time.
- **S124** (LTD) — tinder shall have no liability to you or any third party in the event that tinder exercises any such rights.
- **S128** (USE) — the provision of virtual items for use in the service is a service provided by tinder that commences immediately upon the acceptance of your purchase of such virtual items.
- **S129** (LTD) — you acknowledge that tinder is not required to provide a refund for any reason, and that you will not receive money or other compensation for unused virtual items when an account i…
- **S158** (LTD) — tinder does not represent or warrant that (a) the service will be uninterrupted, secure or error free, (b) any defects or errors in the service will be corrected, or (c) that any c…
- **S159** (LTD) — tinder takes no responsibility for any content that you or another user or third party posts, sends or receives through the services.
- **S191** (PINC) — this agreement, with the privacy policy, the safety tips and any terms disclosed and agreed to by you if you purchase additional features, products or services we offer on the serv…

**Yanlış alarm**

- **S1** (tahmin: TER) — notice to california subscribers: you may cancel your subscription, without penalty or obligation, at any time prior to midnight of the third business day following the date you su…
- **S35** (tahmin: TER) — you may terminate your account at any time, for any reason, by following the instructions in "settings" in the service, however you will need to manage your in app purchases throug…
- **S79** (tahmin: USE) — by using the services, you agree that you will not:
- **S109** (tahmin: LTD) — if a payment is not successfully settled, due to expiration, insufficient funds, or otherwise, and you do not edit your payment method information or cancel your subscription, you …
- **S135** (tahmin: TER) — you may cancel your subscription, without penalty or obligation, at any time prior to midnight of the third business day following the date you subscribed.
- **S157** (tahmin: LTD) — tinder provides the service on an "as is" and "as available" basis and to the extent permitted by applicable law, grants no warranties of any kind, whether express, implied, statut…
- **S162** (tahmin: LTD) — tinder is not responsible for the availability (or lack of availability) of such external websites or resources.
- **S168** (tahmin: A) — arbitration, class-action waiver, and jury waiver.
- **S171** (tahmin: A) — the one exception to the exclusivity of arbitration is that you have the right to bring an individual claim against the company in a small-claims court of competent jurisdiction.
- **S172** (tahmin: A) — but whether you choose arbitration or small-claims court, you may not under any circumstances commence or maintain against the company any class action, class arbitration, or other…
- **S175** (tahmin: A) — you also give up your right to participate in a class action or other class proceeding.
- **S176** (tahmin: A) — your rights will be determined by a neutral arbitrator, not a judge or jury, and the arbitrator shall determine all issues regarding the arbitrability of the dispute.
- **S177** (tahmin: A) — you are entitled to a fair hearing before the arbitrator.
- **S178** (tahmin: A) — the arbitrator can grant any relief that a court can, but you should note that arbitration proceedings are usually simpler and more streamlined than trials and other judicial proce…
- **S179** (tahmin: A) — decisions by the arbitrator are enforceable in court and may be overturned by a court only for very limited reasons.
- **S180** (tahmin: A) — for details on the arbitration process, see our arbitration procedures.
- **S181** (tahmin: A) — any proceeding to enforce this arbitration agreement, including any proceeding to confirm, modify, or vacate an arbitration award, may be commenced in any court of competent jurisd…
- **S186** (tahmin: A) — tinder does not take part in dispute settlement procedures in front of a consumer arbitration entity for users residing in the eu or european economic area.

<details><summary>Taksonomi dışı işaretler (elle incelenmeli)</summary>

- **S24** (tracking_profiling) — if you do so, you authorize us to access and use certain facebook account information, including but not limited to your public facebook profile and information about facebook frie…
- **S48** (content_license) — tinder grants you a personal, worldwide, royalty-free, non-assignable, nonexclusive, revocable, and non-sublicensable license to access and use the services.
- **S68** (content_license) — by creating an account, you grant to tinder a worldwide, transferable, sub-licensable, royalty-free, right and license to host, store, use, copy, display, reproduce, adapt, edit, p…
- **S96** (auto_renewal) — if you purchase an auto-recurring periodic subscription through an in app purchase, your iap account will be billed continuously for the subscription until you cancel.
- **S98** (auto_renewal) — if you do not wish your subscription to renew automatically, or if you want to change or terminate your subscription, you will need to log in to your iap account and follow instruc…
- **S99** (auto_renewal) — deleting your account on tinder or deleting the tinder application from your device does not cancel your subscription; tinder will retain all funds charged to your iap account unti…
- **S104** (auto_renewal) — after your initial subscription commitment period, and again after any subsequent subscription period, your subscription will automatically continue for an additional equivalent pe…
- **S106** (auto_renewal) — if you do not wish your account to renew automatically, or if you want to change or terminate your subscription, please log in and go to "my profile" on tinder online and follow th…
- **S115** (content_license) — from time to time, you may be able to purchase, with "real world" money, a limited, personal, non-transferable, non-sublicensable, revocable license to use "virtual items," includi…
- **S127** (cancellation_refund) — all purchases and redemptions of virtual items made through the service are final and non-refundable.
- **S130** (cancellation_refund) — generally, all charges for purchases are nonrefundable, and there are no refunds or credits for partially used periods.
- **S138** (cancellation_refund) — purchases of virtual items are final and non-refundable.

</details>
