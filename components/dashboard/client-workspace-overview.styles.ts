import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  card: css`
    border-color: ${token.colorBorderSecondary};
    box-shadow: ${token.boxShadowTertiary};
  `,
  cardFullHeight: css`
    border-color: ${token.colorBorderSecondary};
    box-shadow: ${token.boxShadowTertiary};
    height: 100%;
  `,
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  ctaButton: css`
    background: rgba(255, 255, 255, 0.1) !important;
    border-color: rgba(255, 255, 255, 0.6) !important;
    color: ${token.colorWhite} !important;
    font-weight: ${token.fontWeightStrong} !important;

    &:hover {
      background: rgba(255, 255, 255, 0.18) !important;
      border-color: rgba(255, 255, 255, 1) !important;
      color: ${token.colorWhite} !important;
    }
  `,
  hero: css`
    background: linear-gradient(90deg, #1f365c 0%, #355c7d 50%, #4f7cac 100%);
    border-radius: 28px;
    box-shadow: ${token.boxShadowSecondary};
    overflow: hidden;
    padding: ${token.paddingLG}px;

    @media (min-width: 768px) {
      padding: ${token.paddingXL}px;
    }
  `,
  heroActions: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
  `,
  heroBody: css`
    color: ${token.colorWhite};
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  heroDescription: css`
    color: rgba(241, 245, 249, 0.94) !important;
    font-size: ${token.fontSize}px;
    line-height: 1.75;
    margin: 0 !important;
    max-width: 48rem;

    @media (min-width: 768px) {
      font-size: ${token.fontSizeLG}px;
    }
  `,
  heroEyebrow: css`
    background: rgba(255, 255, 255, 0.15);
    border-radius: 9999px;
    color: ${token.colorWhite};
    display: inline-flex;
    font-size: ${token.fontSizeSM}px;
    font-weight: ${token.fontWeightStrong};
    padding: ${token.paddingXXS}px ${token.paddingSM}px;
  `,
  heroHeader: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  heroPrimaryButton: css`
    background: ${token.colorPrimary} !important;
    border: 0 !important;
    color: ${token.colorWhite} !important;
    font-weight: ${token.fontWeightStrong} !important;

    &:hover {
      background: ${token.colorPrimaryHover} !important;
      color: ${token.colorWhite} !important;
    }
  `,
  heroTitle: css`
    color: ${token.colorWhite} !important;
    font-size: 1.875rem !important;
    font-weight: ${token.fontWeightStrong};
    letter-spacing: -0.02em;
    margin: 0 !important;

    @media (min-width: 768px) {
      font-size: 2.25rem !important;
    }
  `,
  metricLabel: css`
    color: ${token.colorTextDescription} !important;
  `,
  metricText: css`
    color: ${token.colorTextDescription} !important;
  `,
  metricTitle: css`
    color: ${token.colorText} !important;
    margin: ${token.marginXS}px 0 ${token.marginXXS}px !important;
  `,
}));
