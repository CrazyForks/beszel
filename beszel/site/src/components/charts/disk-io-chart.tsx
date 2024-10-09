import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
	useYAxisWidth,
	chartTimeData,
	cn,
	formatShortDate,
	toFixedWithoutTrailingZeros,
	twoDecimalString,
	chartMargin,
} from '@/lib/utils'
// import Spinner from '../spinner'
import { useStore } from '@nanostores/react'
import { $chartTime } from '@/lib/stores'
import { SystemStatsRecord } from '@/types'
import { memo, useMemo } from 'react'
import { WritableAtom } from 'nanostores'

/** [label, key, color, opacity] */
type DataKeys = [string, string, number, number]

type NestedValue<T> = (obj: T, path: string, fallbackValue: any) => any

const getNestedValue: NestedValue<object> = (obj, path, fallbackValue) => {
	return path
		.split('.')
		.reduce(
			(acc: any, key: string) => (acc && acc[key] !== undefined ? acc[key] : fallbackValue),
			obj
		)
}

export default memo(function DiskIoChart({
	ticks,
	systemData,
	maxStore,
	unit = ' MB/s',
	chartName,
}: {
	ticks: number[]
	systemData: SystemStatsRecord[]
	maxStore?: WritableAtom<boolean>
	unit?: string
	chartName: string
}) {
	const chartTime = useStore($chartTime)
	const { yAxisWidth, updateYAxisWidth } = useYAxisWidth()
	const showMax = maxStore ? useStore(maxStore) : false

	const m = useMemo(() => (showMax && chartTime !== '1h' ? 'm' : ''), [showMax, systemData])

	const dataKeys: DataKeys[] = useMemo(() => {
		if (chartName === 'CPU Usage') {
			return [[chartName, 'cpu', 1, 0.4]]
		} else if (chartName === 'dio') {
			return [
				['Write', 'dw', 3, 0.3],
				['Read', 'dr', 1, 0.3],
			]
		} else if (chartName === 'bw') {
			return [
				['Sent', 'ns', 5, 0.2],
				['Received', 'nr', 2, 0.2],
			]
		} else if (chartName.startsWith('efs')) {
			return [
				['Write', `${chartName}.w`, 3, 0.3],
				['Read', `${chartName}.r`, 1, 0.3],
			]
		}
		return []
	}, [])

	return (
		<div>
			<ChartContainer
				className={cn('h-full w-full absolute aspect-auto bg-card opacity-0 transition-opacity', {
					'opacity-100': yAxisWidth,
				})}
			>
				<AreaChart accessibilityLayer data={systemData} margin={chartMargin}>
					<CartesianGrid vertical={false} />
					<YAxis
						className="tracking-tighter"
						width={yAxisWidth}
						tickFormatter={(value) => {
							const val = toFixedWithoutTrailingZeros(value, 2) + unit
							return updateYAxisWidth(val)
						}}
						tickLine={false}
						axisLine={false}
					/>
					<XAxis
						dataKey="created"
						domain={[ticks[0], ticks.at(-1)!]}
						ticks={ticks}
						type="number"
						scale={'time'}
						minTickGap={35}
						tickMargin={8}
						axisLine={false}
						tickFormatter={chartTimeData[chartTime].format}
					/>
					<ChartTooltip
						animationEasing="ease-out"
						animationDuration={150}
						content={
							<ChartTooltipContent
								labelFormatter={(_, data) => formatShortDate(data[0].payload.created)}
								contentFormatter={(item) => twoDecimalString(item.value) + unit}
								indicator="line"
							/>
						}
					/>
					{dataKeys.map((key, i) => {
						const color = `hsl(var(--chart-${key[2]}))`
						return (
							<Area
								key={i}
								dataKey={(data) => getNestedValue(data, `stats.${key[1] + m}`, 0)}
								name={key[0]}
								type="monotoneX"
								fill={color}
								fillOpacity={key[3]}
								stroke={color}
								isAnimationActive={false}
							/>
						)
					})}
					{/* <ChartLegend content={<ChartLegendContent />} /> */}
				</AreaChart>
			</ChartContainer>
		</div>
	)
})
