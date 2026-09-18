import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ContentPage } from '../components/ui/ContentPage';

const TermsOfServicePage: React.FC = () => {
  const { t } = useTranslation('legal');
  const registrationItems = t('terms.sections.registration.items', { returnObjects: true }) as string[];
  const acceptableUseItems = t('terms.sections.acceptableUse.items', { returnObjects: true }) as string[];

  return (
    <ContentPage
      kicker={t('common.kicker')}
      title={t('terms.title')}
      meta={t('common.lastUpdated')}
    >
      <h2>{t('terms.sections.acceptance.heading')}</h2>
      <p>{t('terms.sections.acceptance.body')}</p>

      <h2>{t('terms.sections.description.heading')}</h2>
      <p>{t('terms.sections.description.body')}</p>

      <h2>{t('terms.sections.registration.heading')}</h2>
      <p>{t('terms.sections.registration.intro')}</p>
      <ul>
        {registrationItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <h2>{t('terms.sections.acceptableUse.heading')}</h2>
      <p>{t('terms.sections.acceptableUse.intro')}</p>
      <ul>
        {acceptableUseItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <h2>{t('terms.sections.data.heading')}</h2>
      <p>{t('terms.sections.data.body')}</p>

      <h2>{t('terms.sections.scientificContent.heading')}</h2>
      <p>{t('terms.sections.scientificContent.body')}</p>

      <h2>{t('terms.sections.availability.heading')}</h2>
      <p>{t('terms.sections.availability.body')}</p>

      <h2>{t('terms.sections.liability.heading')}</h2>
      <p>{t('terms.sections.liability.body')}</p>

      <h2>{t('terms.sections.intellectualProperty.heading')}</h2>
      <p>{t('terms.sections.intellectualProperty.body')}</p>

      <h2>{t('terms.sections.modifications.heading')}</h2>
      <p>{t('terms.sections.modifications.body')}</p>

      <h2>{t('terms.sections.termination.heading')}</h2>
      <p>{t('terms.sections.termination.body')}</p>

      <h2>{t('terms.sections.governingLaw.heading')}</h2>
      <p>{t('terms.sections.governingLaw.body')}</p>

      <h2>{t('terms.sections.contact.heading')}</h2>
      <p>{t('terms.sections.contact.body')}</p>
      <p>
        {t('common.contactEmailLabel')} {t('common.contactEmail')}<br />
        {t('common.contactOrg')}
      </p>

      <p>
        <Link to="/">{t('common.backToHome')}</Link>
      </p>
    </ContentPage>
  );
};

export default TermsOfServicePage;
