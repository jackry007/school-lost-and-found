// app/help/page.tsx
export const metadata = {
  title: "Help Center | Creek Lost & Found",
  description:
    "Find answers to common questions about Creek Lost & Found. Search articles or contact us for help.",
};

import HelpClient from "./HelpClient";

export default function Page() {
  return <HelpClient />;
}
