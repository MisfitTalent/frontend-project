import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  actions: css`
    display: flex;
    gap: ${token.marginXS}px;
  `,
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  header: css`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  headerCopy: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
  `,
  infoText: css`
    color: ${token.colorTextDescription} !important;
  `,
  insightCard: css`
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    box-shadow: ${token.boxShadowTertiary};
    min-width: 0;
    padding: ${token.paddingLG}px;
  `,
  insightGrid: css`
    display: grid;
    gap: ${token.marginSM}px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (min-width: 1536px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  `,
  metricCard: css`
    border: 1px solid ${token.colorBorderSecondary};
    height: 100%;
  `,
  metricTitle: css`
    margin-bottom: ${token.marginXXS}px !important;
    margin-top: ${token.marginSM}px !important;
    overflow-wrap: anywhere;
  `,
  minColumn: css`
    min-width: 0;
  `,
  subduedText: css`
    color: ${token.colorTextDescription} !important;
    margin-bottom: 0 !important;
  `,
  summaryText: css`
    color: ${token.colorTextSecondary} !important;
    overflow-wrap: anywhere;
  `,
  title: css`
    margin: 0 !important;
  `,
}));
