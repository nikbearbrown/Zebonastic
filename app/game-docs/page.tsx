import { join } from 'path'
import { readFileSync } from 'fs'
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import PrimaryButton from "@/components/ui/primary-button"
import SecondaryButton from "@/components/ui/secondary-button"
import ReportsBrowser from './ReportsBrowser'

export const metadata: Metadata = {
  title: "Fellows Program - Humanitarians AI",
  description: "Join our global community of talented volunteers dedicated to using AI for humanitarian causes",
}

const substacks = [
  {
    name: "80 Days to Stay",
    url: "https://80daystostay.substack.com/",
    focus: "Job tools and Agentic AI designed to bring transparency and efficiency to the OPT (Optional Practical Training) job search process.",
  },
  {
    name: "Boyle Project (The Boyle System)",
    url: "https://boyleproject.substack.com/",
    focus: "A scientific notebook approach using NotebookLM as a cognitive partner to enforce reproducibility, traceable knowledge, and method-focused documentation.",
  },
  {
    name: "Branding & AI",
    url: "https://brandingartificialintelligence.substack.com/",
    focus: "An \u201cintelligent textbook\u201d for Northeastern course INFO 7375 focused on professional positioning and technical contributions to the Madison Framework.",
  },
  {
    name: "Dayhoff Project",
    url: "https://dayhoffproject.substack.com/",
    focus: "An open-source, agent-based AI bioinformatics framework for computational biology, epidemiology, and public health.",
  },
  {
    name: "Humanitarians AI",
    url: "https://humanitariansai.substack.com/",
    focus: "The central hub for the 501(c)(3) non-profit, providing project-based volunteer opportunities in AI development and application.",
  },
  {
    name: "Lyrical Literacy Project",
    url: "https://lyricalliteracyproject.substack.com/",
    focus: "Exploring the neuroscience of singing and brain research to improve cognitive development and language learning.",
  },
  {
    name: "Medhavy",
    url: "https://medhavy.substack.com/",
    focus: "An AI-powered textbook project focused on educational applications of machine learning.",
  },
  {
    name: "Musinique",
    url: "https://musinique.substack.com/",
    focus: "Music-related content, history of record labels, and Spotify algorithm research.",
  },
  {
    name: "Northeastern ISE",
    url: "https://northeasternise.substack.com/",
    focus: "A collaborative hub where current Northeastern students and recent graduates work together on shared projects and frameworks.",
  },
  {
    name: "Politics and AI",
    url: "https://politicalai.substack.com/",
    focus: "Data journalism and Agentic AI dedicated to increasing transparency within the political landscape.",
  },
  {
    name: "Popper (Computational Skepticism)",
    url: "https://popperskepticism.substack.com/",
    focus: "An open-source framework for systematic AI validation and computational skepticism, emphasizing the principle of falsifiability to identify biases and inconsistencies in AI systems.",
  },
  {
    name: "The Learning Engineer",
    url: "https://learningengineering.substack.com/",
    focus: "Engineering approaches to learning design and educational technology.",
  },
  {
    name: "The Madison Project",
    url: "https://madisonproject.substack.com/",
    focus: "An open-source, agentic marketing and branding framework designed for data-driven advertising and marketing intelligence.",
  },
  {
    name: "The Mycroft Project",
    url: "https://mycroftproject.substack.com/",
    focus: "An educational experiment \u201cusing AI to invest in AI,\u201d utilizing specialized agents to analyze the investment landscape.",
  },
  {
    name: "The RAMAN Effect Project",
    url: "https://ramaneffectwpe.substack.com/",
    focus: "Advancing public health surveillance through AI-driven spectroscopy and wastewater-based epidemiology.",
  },
  {
    name: "Wilkes",
    url: "https://wilkesproject.substack.com/",
    focus: "AI storytelling for nonprofits that translates raw field material (footage, transcripts, notes) into bespoke, published narratives in the organization\u2019s own voice to increase donor engagement.",
  },
  {
    name: "Zebonastic",
    url: "https://zebonastic.substack.com/",
    focus: "Digital prompts and AI-generated creative work specifically for games and film.",
  },
]

export const dynamic = 'force-dynamic'

export default function FellowsPage() {
  const raw = readFileSync(join(process.cwd(), 'public', 'reports', 'reports.json'), 'utf-8')
  const reports = JSON.parse(raw)

  return (
    <div className="container px-4 md:px-6 mx-auto py-12">
      <div className="max-w-4xl mx-auto">
        {/* Reports Search */}
        <section className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Fellow Reports</h1>
          <p className="text-muted-foreground mb-8">
            Browse reports and documentation from our fellows.
          </p>
          <ReportsBrowser reports={reports} />
        </section>

        {/* Hero Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Fellows Program</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join our global community of talented volunteers dedicated to using AI for humanitarian causes. The Fellows Program offers hands-on experience with cutting-edge AI projects, professional development, and networking opportunities with like-minded innovators committed to positive impact.
          </p>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-8">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/GN7yQntWJHU?si=8AjS_CU4w3MoSPJT"
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-12">
          <section>
            <h2 className="text-3xl font-bold mb-6">About the Project</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                The Humanitarians AI Fellows Program connects skilled volunteers with meaningful AI projects addressing real-world challenges. Fellows contribute their expertise while gaining valuable experience, mentorship, and professional recognition.
              </p>
              <p>
                Our structured program ensures accountability through regular documentation, providing verifiable evidence of your contributions for recommendation letters and professional verification. Join our community of innovators using technology to create positive social impact through collaborative, open-source development.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-6 border rounded-lg">
                <h3 className="text-xl font-bold mb-3">Real-World Impact</h3>
                <p className="text-muted-foreground">
                  Work on cutting-edge AI projects with direct humanitarian applications, from enhancing literacy through music to developing accessible AI interfaces for underserved communities.
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <h3 className="text-xl font-bold mb-3">Professional Development</h3>
                <p className="text-muted-foreground">
                  Build your portfolio with documented contributions, receive mentorship from industry experts, and gain valuable skills in project management, documentation, and collaborative development.
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <h3 className="text-xl font-bold mb-3">Entrepreneurship Pathway</h3>
                <p className="text-muted-foreground">
                  Explore opportunities to transform volunteer projects into commercial ventures through our dedicated Entrepreneurship Program, with support for business model development and access to potential investors.
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <h3 className="text-xl font-bold mb-3">Global Community</h3>
                <p className="text-muted-foreground">
                  Connect with a diverse network of talented professionals committed to using AI for good, participating in team collaborations and community events that expand your professional horizons.
                </p>
              </div>
            </div>
          </section>

          {/* Fellows Substack Directory */}
          <section>
            <h2 className="text-3xl font-bold mb-4">Fellows Substack Directory</h2>
            <p className="text-muted-foreground mb-8">
              Each fellow project publishes openly on Substack, creating a living record of research, progress, and impact. Explore our active publications below.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {substacks.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 border rounded-lg hover:border-primary transition-colors group"
                >
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{s.focus}</p>
                </a>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">Join Our Community</h2>
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              <PrimaryButton href="/contact">
                Apply Now
              </PrimaryButton>
              <SecondaryButton href="/donate">
                Support Fellows
              </SecondaryButton>
              <PrimaryButton href="/programs/fellows/fellows-details">
                Learn More
              </PrimaryButton>
              <SecondaryButton href="/programs/fellows/explore">
                View Projects
              </SecondaryButton>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
