
interface IStatisticDisplay {
    title: string;
    unit?: string;
    value: number;
}

const StatisticDisplay: React.FC<IStatisticDisplay> = ({title, unit, value}) => {
    return (
        <div>
            <span>{title}</span>
            {unit ?
                <div>
                    <span>{unit}</span>
                    <span>{value}</span>
                </div>
                :
                <span>{value}</span>
            }
        </div>
    );
}

export default StatisticDisplay;