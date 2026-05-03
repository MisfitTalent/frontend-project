import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  benefitCard: css`
    backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingMD}px ${token.paddingLG}px;
  `,
  benefits: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  content: css`
    display: grid;
    gap: ${token.marginXL}px;
    margin: 0 auto;
    max-width: 1120px;
    min-height: calc(100vh - 5rem);

    @media (min-width: 992px) {
      align-items: center;
      grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
    }
  `,
  footerText: css`
    color: ${token.colorTextDescription} !important;
    margin-bottom: 0 !important;
    text-align: center;
  `,
  formInner: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
    max-width: 672px;
    width: 100%;
  `,
  formWrap: css`
    display: flex;
    justify-content: center;
  `,
  hero: css`
    background: linear-gradient(160deg, #f8fafc, #eef3f8 45%, #fde6cc);
    min-height: 100vh;
    padding: ${token.paddingLG}px;
  `,
  heroCopy: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  subtitle: css`
    color: ${token.colorTextDescription} !important;
    font-size: ${token.fontSizeLG}px !important;
    margin-bottom: 0 !important;
    max-width: 640px;
  `,
  title: css`
    font-size: clamp(2.8rem, 6vw, 4rem) !important;
    line-height: 1.1 !important;
    margin-bottom: 0 !important;
  `,
}));
