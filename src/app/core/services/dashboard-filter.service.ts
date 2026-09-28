import { inject, Service } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FilterModal } from '../../components/filter-modal/filter-modal';
import { ColNationalService } from './dashboard-services/col-national.service';
import { WidgetItem, WidgetItemDash } from '../../interfaces/ipm.interface';
import { ScrollStrategyOptions } from '@angular/cdk/overlay';

@Service()
export class DashboardFilterService {
    private readonly dialog = inject(MatDialog);
    private dashboardService = inject(ColNationalService);
    private scrollStrategies = inject(ScrollStrategyOptions);

    openCardFilter(widget: WidgetItemDash, currentFilters: { year?: number; domain?: string, country?: string, area?: string }) {
        const dialogRef = this.dialog.open(FilterModal, {
            width: '400px',
            data: {
                title: widget.label,
                filterFields: widget.filterFields,
                widget,
                currentFilters
            },
            scrollStrategy: this.scrollStrategies.noop()

        });

        return dialogRef.afterClosed();

    }


}
