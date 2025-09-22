
interface IStatisticDisplay {
    title: string;
    unit?: string;
    value: number;
}

const StatisticDisplay: React.FC<IStatisticDisplay> = ({title, unit, value}) => {
    const numToUsDollarCurrency = Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value)
    return (
        <div className="flex flex-col justify-center items-center m-6">
            {unit ?
                <div>
                    <span>{unit}</span>
                    <span>{numToUsDollarCurrency}</span>
                </div>
                :
                <span className="mb-4 text-4xl text-textWhite">{numToUsDollarCurrency}</span>
            }
            <span className="text-3xl font-bold text-textGrayDark">{title}</span>
        </div>
    );
}

export default StatisticDisplay;