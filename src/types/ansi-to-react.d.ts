// Type declaration for ansi-to-react (no official @types package available)
declare module 'ansi-to-react' {
    import { ReactNode } from 'react';

    interface AnsiProps {
        children?: string;
        linkify?: boolean;
        useClasses?: boolean;
    }

    const Ansi: (props: AnsiProps) => ReactNode;
    export default Ansi;
}
