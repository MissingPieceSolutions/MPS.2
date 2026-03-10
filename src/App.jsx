import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { GenericPage } from './pages/GenericPage';
import { BlogDetailPage, BlogIndexPage } from './pages/BlogPages';
import { CaseStudiesIndexPage, CaseStudyDetailPage, CaseStudyLegacyPage } from './pages/CaseStudyPages';
import { ResourcesIndexPage, ResourceDetailPage } from './pages/ResourcePages';
import { TestimonialsPage } from './pages/TestimonialsPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route
          path="/about-us"
          element={
            <GenericPage
              title="About MPS"
              description="We are a delivery-focused AI and automation partner for startups and SMBs that need practical outcomes fast."
              path="/about-us"
              eyebrow="About"
            />
          }
        />
        <Route
          path="/services"
          element={
            <GenericPage
              title="Services"
              description="Done-for-you implementation, integration engineering, and ongoing optimization across your automation stack."
              path="/services"
              eyebrow="Services"
            />
          }
        />
        <Route
          path="/solutions"
          element={
            <GenericPage
              title="Solutions"
              description="Workflow automation, chatbots, CRM integrations, and reporting systems designed around real operating constraints."
              path="/solutions"
              eyebrow="Solutions"
            />
          }
        />
        <Route
          path="/workflow-automation"
          element={
            <GenericPage
              title="Workflow Automation"
              description="Automate repetitive processes with reliable orchestration across tools and teams."
              path="/workflow-automation"
              eyebrow="Automation"
            />
          }
        />
        <Route
          path="/chatbots"
          element={
            <GenericPage
              title="Chatbots and Assistants"
              description="Deploy support and internal assistants that use your knowledge base and workflows effectively."
              path="/chatbots"
              eyebrow="AI Assistants"
            />
          }
        />
        <Route
          path="/crm-integrations"
          element={
            <GenericPage
              title="CRM Integrations"
              description="Connect CRM events with automation logic so your pipeline and customer data stay consistent."
              path="/crm-integrations"
              eyebrow="CRM"
            />
          }
        />
        <Route
          path="/for-startups"
          element={
            <GenericPage
              title="For Startups"
              description="Lean implementation support for fast-moving teams that need to scale operations without hiring a large ops team."
              path="/for-startups"
              eyebrow="Startups"
            />
          }
        />
        <Route
          path="/for-smbs"
          element={
            <GenericPage
              title="For SMBs"
              description="Modernize operations and customer workflows with practical automation tailored for SMB constraints."
              path="/for-smbs"
              eyebrow="SMBs"
            />
          }
        />

        <Route path="/blog" element={<BlogIndexPage />} />
        <Route path="/blog-post" element={<BlogIndexPage />} />
        <Route path="/blog-post/:slug" element={<BlogDetailPage />} />

        <Route path="/case-studies" element={<CaseStudiesIndexPage />} />
        <Route path="/case-study" element={<CaseStudyLegacyPage />} />
        <Route path="/case-study/:slug" element={<CaseStudyDetailPage />} />

        <Route path="/resources" element={<ResourcesIndexPage />} />
        <Route path="/resources/:slug" element={<ResourceDetailPage />} />

        <Route path="/testimonials" element={<TestimonialsPage />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route
          path="/careers"
          element={
            <GenericPage
              title="Careers"
              description="Join MPS to build practical AI and automation systems that improve how modern teams operate."
              path="/careers"
              eyebrow="Careers"
            />
          }
        />
        <Route
          path="/faq"
          element={
            <GenericPage
              title="FAQ"
              description="Answers about delivery scope, timeline, tooling, and how MPS collaborates with your team."
              path="/faq"
              eyebrow="FAQ"
            />
          }
        />
        <Route
          path="/legal"
          element={
            <GenericPage
              title="Legal"
              description="Terms, privacy, and compliance placeholders for production legal content."
              path="/legal"
              eyebrow="Legal"
            />
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
