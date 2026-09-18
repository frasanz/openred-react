import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ContentPage } from '../components/ui/ContentPage';

const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation('legal');
  const usageItems = t('privacy.sections.usage.items', { returnObjects: true }) as string[];
  const accountDeletionSteps = t('privacy.sections.accountDeletion.steps', { returnObjects: true }) as string[];
  const accountDeletionDeletedItems = t('privacy.sections.accountDeletion.deletedItems', { returnObjects: true }) as string[];
  const accountDeletionRetainedItems = t('privacy.sections.accountDeletion.retainedItems', { returnObjects: true }) as string[];
  const dataDeletionSteps = t('privacy.sections.dataDeletion.steps', { returnObjects: true }) as string[];
  const dataDeletionDeletableItems = t('privacy.sections.dataDeletion.deletableItems', { returnObjects: true }) as string[];
  const dataDeletionRetainedItems = t('privacy.sections.dataDeletion.retainedItems', { returnObjects: true }) as string[];

  return (
    <ContentPage
      kicker={t('common.kicker')}
      title={t('privacy.title')}
      meta={t('common.lastUpdated')}
    >
      <h2>{t('privacy.sections.collection.heading')}</h2>
      <p>{t('privacy.sections.collection.body')}</p>

      <h2>{t('privacy.sections.usage.heading')}</h2>
      <p>{t('privacy.sections.usage.intro')}</p>
      <ul>
        {usageItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <h2>{t('privacy.sections.sharing.heading')}</h2>
      <p>{t('privacy.sections.sharing.body')}</p>

      <h2>{t('privacy.sections.security.heading')}</h2>
      <p>{t('privacy.sections.security.body')}</p>

      <h2>{t('privacy.sections.rights.heading')}</h2>
      <p>{t('privacy.sections.rights.body')}</p>

      <h2>{t('privacy.sections.cookies.heading')}</h2>
      <p>{t('privacy.sections.cookies.body')}</p>

      <h2>{t('privacy.sections.googleAuth.heading')}</h2>
      <p>{t('privacy.sections.googleAuth.body')}</p>

      <h2 id="account-deletion">{t('privacy.sections.accountDeletion.heading')}</h2>
      <p>{t('privacy.sections.accountDeletion.intro')}</p>
      <ol>
        {accountDeletionSteps.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ol>
      <h3>{t('privacy.sections.accountDeletion.deletedHeading')}</h3>
      <p>{t('privacy.sections.accountDeletion.deletedIntro')}</p>
      <ul>
        {accountDeletionDeletedItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <h3>{t('privacy.sections.accountDeletion.retainedHeading')}</h3>
      <p>{t('privacy.sections.accountDeletion.retainedIntro')}</p>
      <ul>
        {accountDeletionRetainedItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <h2 id="data-deletion">{t('privacy.sections.dataDeletion.heading')}</h2>
      <p>{t('privacy.sections.dataDeletion.intro')}</p>
      <ol>
        {dataDeletionSteps.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ol>
      <h3>{t('privacy.sections.dataDeletion.deletableHeading')}</h3>
      <ul>
        {dataDeletionDeletableItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <h3>{t('privacy.sections.dataDeletion.retainedHeading')}</h3>
      <p>{t('privacy.sections.dataDeletion.retainedIntro')}</p>
      <ul>
        {dataDeletionRetainedItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <h2>{t('privacy.sections.changes.heading')}</h2>
      <p>{t('privacy.sections.changes.body')}</p>

      <h2>{t('privacy.sections.contact.heading')}</h2>
      <p>{t('privacy.sections.contact.body')}</p>
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

export default PrivacyPolicyPage;
