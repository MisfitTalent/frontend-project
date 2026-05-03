import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  automationCard: css`
    height: 100%;
  `,
  automationFeed: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  automationItem: css`
    background: ${token.colorFillAlter};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    min-width: 0;
    padding: ${token.paddingMD}px;
  `,
  breakText: css`
    overflow-wrap: anywhere;
  `,
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  infoText: css`
    color: ${token.colorTextDescription} !important;
  `,
  metricTagRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
    margin-top: ${token.marginXS}px;
  `,
  metricCard: css`
    border: 1px solid ${token.colorBorderSecondary};
    height: 100%;
  `,
  priorityCard: css`
    background: linear-gradient(135deg, #eef3f8, #ecf4ff);
    border: 1px solid ${token.colorBorderSecondary};
  `,
  priorityDetails: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;

    @media (min-width: 1280px) {
      align-items: center;
      flex-direction: row;
      justify-content: space-between;
    }
  `,
  priorityGrid: css`
    display: grid;
    gap: ${token.marginSM}px;
    width: 100%;

    @media (min-width: 576px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (min-width: 1536px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (min-width: 1280px) {
      max-width: 32rem;
    }
  `,
  priorityItem: css`
    background: ${token.colorBgContainer};
    border: 1px solid rgba(79, 124, 172, 0.12);
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingMD}px;
  `,
  rowColumn: css`
    min-width: 0;
  `,
  titleReset: css`
    margin-bottom: 0 !important;
  `,
  titleBlock: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
    min-width: 0;
  `,
  subduedText: css`
    color: ${token.colorTextDescription} !important;
    margin-bottom: 0 !important;
    margin-top: ${token.marginXXS}px !important;
  `,
}));
