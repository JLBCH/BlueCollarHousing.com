import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Terms & Privacy",
  description:
    "BlueCollarHousing.com terms and conditions of use, disclaimers, privacy policy and choice of law.",
};

// Legal copy provided by the client (carried over from the previous site).
// Kept as plain strings so apostrophes and quotes render without JSX escaping.
// This is a working placeholder pending an attorney review.
const SECTIONS: { heading: string; paras: string[] }[] = [
  {
    heading: "Explanation of Service and Disclaimers",
    paras: [
      "Bluecollarhousing.com is a lodging locating hub website designed to put workers in touch with property owners who desire to list available lodging for rent in locations where out-of-town workers are in need of alternatives to traditional motels or mancamps.",
      "Bluecollarhousing.com does not personally inspect the properties listed, it only provides a hub for listings to be seen in one place. As such, bluecollarhousing.com does not warrant, guarantee, nor make any promises as to the condition, habitability or amenities of the listed properties.",
      "Bluecollarhousing.com does not provide for any monetary transaction to occur through its website. All monetary transactions will be made directly between the Owner/Advertiser and the Renter.",
      "Bluecollarhousing.com expressly denies any responsibility for inaccurate or erroneous property listing information and does not make any warranties as to the habitability of the properties. It is the responsibility of all involved in the individual transactions to properly vet, ask questions, seek additional information, and investigate the properties listed prior to renting.",
      "Once the property is listed by the Owner/Advertiser on bluecollarhousing.com, all communications will occur between the Owner/Advertiser and the Renter. All monetary transactions and agreements will occur between the Owner/Advertiser and the Renter.",
      "“Owners/Advertisers” are those individuals who own or have rights to market a property, RV, room for rent, mobile home, cabin, and the like and have entered into a Property Posting Agreement with bluecollarhousing.com. All Property Posting Agreements are subject to a yearly fee which is not refundable during that yearly term, no matter the circumstances.",
      "If you, as an Owner/Advertiser, are unhappy with your listing results, please contact us at bluecollarhousing.com and we will happily discuss modifications to your listing to increase interest in your property. Again, no refunds will be made for listings once the Property Posting Agreement is signed and paid and the Property is posted on the website. Posting Agreements may be transferred to new property owners during the year term. Upon expiration of the year term, the new owner must enter into its own Agreement with bluecollarhousing.com",
      "“Renters” are those individuals who are seeking lodging to rent from the Owner/Advertiser directly after locating the desired lodging on the bluecollarhousing.com website.",
    ],
  },
  {
    heading: "Access to the Website",
    paras: [
      "We work hard to ensure the Website is always up and available, but we can’t guarantee that the Website will not have downtime for any reason. We reserve the right to close the Website for short periods of time for general maintenance, but will attempt to keep this to a minimum. We will not be liable if for any reason all or any part of the Website is unavailable at any time, for any length of time.",
      "Parts of the Website require you to input a password to access certain features. To do this, as part of our security procedures, we require you to register an account with Company by entering your email and choosing a secure password. We highly recommend that you choose a strong password that is hard for others to guess, and you log out from your account at the end of every session. There is a password reset procedure in case you forget your password. You must treat your account log-in information as confidential, not disclosing it to any third party. If you think there may have been any breach of security then it is your responsibility to notify us immediately and if log-in is possible, to change your password.",
      "It is a condition of your use of the Website that all the information you provide on the Website is correct, current and complete. We reserve the right to disable any user account in our sole discretion, at any time for any or no reason, including if, in our opinion, you have failed to comply with any provision or if your listing is questionable based on one or more complaints from Renters.",
      "We do not guarantee that the Website or any content provided on the Website is error free.",
    ],
  },
  {
    heading: "Privacy Policy",
    paras: [
      "Bluecollarhousing.com only keeps personal information of Owners/Advertisers and Renters to the extent necessary to maintain accurate information on our customers and to help facilitate a lodging match, if necessary. Bluecollarhousing.com does not sell or share any private information of its customers with any other third party. Bluecollarhousing.com uses great care in maintaining user privacy and uses their information in-house and only to the extent necessary to assist in finding a proper lodging outcome for our Owners/Advertisers and our Renters.",
    ],
  },
  {
    heading: "Choice of Law",
    paras: [
      "By accepting these Terms and Conditions of Use, you agree to subject yourself to the Laws of the State of Texas, Galveston County, Texas for any and all complaints, claims or demands of any type. Any legal action of any type will be had under the Laws of the State of Texas and in Galveston County, Texas.",
    ],
  },
  {
    heading: "Site Policies and Modifications of Terms of Use",
    paras: [
      "We reserve the right to make changes to our site, policies, terms and these Conditions of Use at any time. If any of these conditions shall be deemed invalid, void, or for any reason unenforceable, that condition shall be deemed severable and shall not affect the validity and enforceability of any remaining condition.",
      "Questions regarding our Conditions of Usage, Privacy Policy, or other policy related material can be directed to our support staff by clicking on the “Contact Us” link in the side menu.",
    ],
  },
];

export default function TermsPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-[800px]">
        <div className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
            Legal
          </p>
          <h1 className="font-display mt-3 text-[36px] font-bold text-navy sm:text-[44px]">
            Terms and Conditions of Use
          </h1>
        </div>

        <div className="mt-10 space-y-10">
          {SECTIONS.map(({ heading, paras }) => (
            <div key={heading}>
              <h2 className="font-display text-[20px] font-bold text-navy sm:text-[22px]">
                {heading}
              </h2>
              <div className="mt-3 space-y-3">
                {paras.map((para, i) => (
                  <p key={i} className="text-[15px] leading-relaxed text-[#3a4a5a]">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
