import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  backdropHidden: css`
    opacity: 0;
    pointer-events: none;
  `,
  body: css`
    background: #1f365c;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  `,
  brandRow: css`
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: ${token.marginSM}px;
    padding: ${token.paddingLG}px ${token.paddingXL}px ${token.paddingMD}px;
  `,
  brandText: css`
    min-width: 0;
  `,
  contentPadding: css`
    padding: ${token.paddingMD}px;

    @media (min-width: 768px) {
      padding: ${token.paddingLG}px;
    }
  `,
  header: css`
    align-items: center;
    background: #1f365c;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
    padding: ${token.paddingSM}px ${token.paddingMD}px;
    position: sticky;
    top: 0;
    z-index: 30;

    @media (min-width: 768px) {
      padding-left: ${token.paddingLG}px;
      padding-right: ${token.paddingLG}px;
    }
  `,
  headerLead: css`
    display: flex;
    flex: 1;
    min-width: 0;
  `,
  headerCopy: css`
    flex: 1;
    min-width: 0;
  `,
  headerDescription: css`
    color: rgb(203 213 225) !important;
    display: block;
    max-width: 100%;
    overflow-wrap: anywhere;
    white-space: normal;
  `,
  headerTag: css`
    flex: 0 0 auto;
    margin-inline-start: auto;
  `,
  headerTitle: css`
    color: #fff !important;
    font-size: ${token.fontSize}px !important;
    margin-bottom: 0 !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  heroTag: css`
    color: #fff !important;
    font-weight: ${token.fontWeightStrong};
  `,
  iconButton: css`
    color: #fff !important;

    &:hover {
      color: #f7b267 !important;
    }
  `,
  loadingContainer: css`
    align-items: center;
    display: flex;
    justify-content: center;
    min-height: 40vh;
  `,
  loadingCopy: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
    text-align: center;
  `,
  loadingDescription: css`
    color: ${token.colorTextDescription} !important;
  `,
  loadingTitle: css`
    color: ${token.colorText} !important;
    margin-bottom: 0 !important;
  `,
  menu: css`
    background: transparent;
    border: 0;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: ${token.paddingSM}px ${token.paddingXS}px;
  `,
  menuLabel: css`
    align-items: center;
    display: inline-flex;
    gap: ${token.marginXS}px;
    justify-content: space-between;
    width: 100%;
  `,
  mutedText: css`
    color: rgb(203 213 225) !important;
    display: block;
  `,
  navBadge: css`
    @keyframes dashboard-nav-badge-pulse {
      0% {
        box-shadow:
          0 0 0 1px rgba(255, 255, 255, 0.22),
          0 0 0 4px rgba(242, 140, 40, 0.14),
          0 0 18px rgba(242, 140, 40, 0.42),
          0 10px 24px rgba(242, 140, 40, 0.24);
        transform: scale(1);
      }

      50% {
        box-shadow:
          0 0 0 1px rgba(255, 255, 255, 0.28),
          0 0 0 7px rgba(242, 140, 40, 0.18),
          0 0 28px rgba(242, 140, 40, 0.5),
          0 14px 30px rgba(242, 140, 40, 0.28);
        transform: scale(1.06);
      }

      100% {
        box-shadow:
          0 0 0 1px rgba(255, 255, 255, 0.22),
          0 0 0 4px rgba(242, 140, 40, 0.14),
          0 0 18px rgba(242, 140, 40, 0.42),
          0 10px 24px rgba(242, 140, 40, 0.24);
        transform: scale(1);
      }
    }

    align-items: center;
    animation: dashboard-nav-badge-pulse 1.65s ease-in-out infinite;
    background:
      radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0) 38%),
      linear-gradient(135deg, #f28c28 0%, #f59e0b 45%, #fb923c 100%);
    border-radius: 9999px;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.22),
      0 0 0 4px rgba(242, 140, 40, 0.14),
      0 0 18px rgba(242, 140, 40, 0.42),
      0 10px 24px rgba(242, 140, 40, 0.24);
    color: #fff;
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 0.82rem;
    font-weight: 900;
    height: 1.45rem;
    justify-content: center;
    line-height: 1;
    min-width: 1.45rem;
    text-shadow: 0 1px 2px rgba(124, 45, 18, 0.35);
  `,
  root: css`
    min-height: 100vh;
    position: relative;
  `,
  sidebar: css`
    inset: 0 auto 0 0;
    position: fixed;
    transform: translateX(0);
    transition:
      transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 280ms ease;
    width: 300px;
    z-index: 50;

    @media (max-width: 1023px) {
      box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
    }
  `,
  sidebarCollapsed: css`
    box-shadow: none;
    transform: translateX(calc(-100% - 20px));
  `,
  sidebarSection: css`
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
    padding: ${token.paddingMD}px ${token.paddingLG}px;
    flex-shrink: 0;
  `,
  title: css`
    color: #fff !important;
    margin-bottom: 0 !important;
  `,
  userBlock: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
  `,
  userName: css`
    color: #fff !important;
    display: block;
    font-weight: ${token.fontWeightStrong};
  `,
}));
