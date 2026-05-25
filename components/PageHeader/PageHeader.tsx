import AddButton from "../AddButton";

interface PageHeaderProps {
    title: string;
    subtitle?: string;       //
    buttonLabel?: string;    
    buttonHref?: string;     
}   

export default function PageHeader({ title, subtitle, buttonLabel, buttonHref }: PageHeaderProps) {
    return (
        <header className="flex items-start justify-between mb-8">
            <div>
                <h1 className="text-4xl font-bold text-slate-800 m-0">
                    {title}
                </h1>
                    
                {subtitle && (
                    <p className="text-slate-500 text-base mt-2 m-0">
                        {subtitle}
                    </p>
                )}
            </div>

            {buttonLabel && buttonHref && (
                <AddButton href={buttonHref} label={buttonLabel} />
            )}
        </header>
    );
}