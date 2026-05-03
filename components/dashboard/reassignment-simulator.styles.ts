import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  card: css`
    height: 100%;
  `,
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  dealSelect: css`
    width: 100%;

    .ant-select-selector {
      align-items: flex-start;
      min-height: calc(${token.controlHeightLG}px + ${token.paddingSM}px) !important;
      padding-bottom: ${token.paddingSM}px !important;
      padding-top: ${token.paddingSM}px !important;
    }

    .ant-select-selection-overflow {
      align-items: center;
      gap: ${token.marginXXS}px;
    }

    &.ant-select-multiple .ant-select-selection-item,
    &.ant-select-multiple .ant-select-selection-overflow-item {
      max-width: 100%;
    }
  `,
  formGrid: css`
    display: grid;
    gap: ${token.marginSM}px;
    grid-template-columns: minmax(0, 1fr);

    @media (min-width: 1280px) {
      grid-template-columns: minmax(0, 1.65fr) minmax(260px, 0.9fr);
    }
  `,
  hiddenTag: css`
    display: none;
  `,
  inlineActions: css`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  loadingState: css`
    align-items: center;
    background: ${token.colorFillAlter};
    border-radius: ${token.borderRadiusLG}px;
    color: ${token.colorTextDescription};
    display: flex;
    gap: ${token.marginSM}px;
    padding: ${token.paddingMD}px;
  `,
  metricGrid: css`
    display: grid;
    gap: ${token.marginSM}px;
    grid-template-columns: minmax(0, 1fr);

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (min-width: 1280px) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  `,
  optionContent: css`
    padding: 2px 0;
  `,
  optionMeta: css`
    color: ${token.colorTextDescription};
    display: flex;
    flex-wrap: wrap;
    font-size: ${token.fontSizeSM}px;
    gap: ${token.marginXXS}px ${token.marginSM}px;
    margin-top: ${token.marginXXS}px;
  `,
  optionTitle: css`
    color: ${token.colorText} !important;
    display: block;
    font-weight: ${token.fontWeightStrong};
  `,
  resultContainer: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  rightAlign: css`
    display: flex;
    justify-content: flex-end;
  `,
  select: css`
    width: 100%;
  `,
  summaryTag: css`
    background: ${token.colorPrimaryBg};
    border: 1px solid ${token.colorPrimaryBorder};
    border-radius: ${token.borderRadiusLG}px;
    color: ${token.colorPrimaryText};
    display: inline-flex;
    font-size: ${token.fontSizeSM}px;
    font-weight: ${token.fontWeightStrong};
    max-width: 100%;
    padding: 4px ${token.paddingSM}px;
  `,
  subtitle: css`
    color: ${token.colorTextDescription} !important;
  `,
  warningCard: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
  `,
  warningText: css`
    color: ${token.colorTextDescription} !important;
    margin-bottom: 0 !important;
  `,
}));
