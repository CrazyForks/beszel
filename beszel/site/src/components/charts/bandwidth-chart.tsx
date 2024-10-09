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
import { $bandwidthMax, $chartTime } from '@/lib/stores'
import { SystemStatsRecord } from '@/types'
import { useEffect, useMemo } from 'react'

export default function BandwidthChart({
	ticks,
	systemData,
	dataKeys,
}: {
	ticks: number[]
	systemData: SystemStatsRecord[]
	dataKeys: string[]
}) {
	const chartTime = useStore($chartTime)
	const { yAxisWidth, updateYAxisWidth } = useYAxisWidth()
	const showMax = useStore($bandwidthMax)

	const keys = useMemo(() => {
		if (!showMax || chartTime == '1h') {
			return dataKeys
		}
		return dataKeys.map((key) => key + 'm')
	}, [showMax, systemData])

	// make sure pns and pnr exist
	const data = useMemo(() => {
		if (chartTime !== '1h') {
			for (let d of systemData) {
				if (!d.stats?.cpum) {
					continue
				}
				d.stats.nsm ||= 0
				d.stats.nrm ||= 0
			}
		}
		return systemData
	}, [systemData])

	return (
		<div>
			{/* {!yAxisSet && <Spinner />} */}
			<ChartContainer
				className={cn('h-full w-full absolute aspect-auto bg-card opacity-0 transition-opacity', {
					'opacity-100': yAxisWidth,
				})}
			>
				<AreaChart accessibilityLayer data={data} margin={chartMargin}>
					<CartesianGrid vertical={false} />
					<YAxis
						className="tracking-tighter"
						width={yAxisWidth}
						// domain={[0, (max: number) => (max <= 0.4 ? 0.4 : Math.ceil(max))]}
						tickFormatter={(value) => {
							const val = toFixedWithoutTrailingZeros(value, 2) + ' MB/s'
							return updateYAxisWidth(val)
						}}
						tickLine={false}
						axisLine={false}
						// unit={' MB/s'}
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
								contentFormatter={(item) => twoDecimalString(item.value) + ' MB/s'}
								indicator="line"
							/>
						}
					/>
					{keys.map((key, i) => {
						const action = i ? 'Received' : 'Sent'
						const color = i ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-5))'
						return (
							<Area
								key={i}
								dataKey={`stats.${key}`}
								name={action}
								type="monotoneX"
								fill={color}
								fillOpacity={0.2}
								stroke={color}
								isAnimationActive={false}
							/>
						)
					})}
				</AreaChart>
			</ChartContainer>
		</div>
	)
}
