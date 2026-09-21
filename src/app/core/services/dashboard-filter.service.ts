import { inject, Service } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FilterModal } from '../../components/filter-modal/filter-modal';
import { ColNationalService } from './dashboard-services/col-national.service';
import { WidgetItem, WidgetItemDash } from '../../interfaces/ipm.interface';

@Service()
export class DashboardFilterService {
    private readonly dialog = inject(MatDialog);
    private dashboardService = inject(ColNationalService);

    openCardFilter(widget: WidgetItemDash, currentFilters: { year?: number; domain?: string }) {
        // Lee las listas específicas llamando a las funciones que devuelven los signals del widget
        const years = widget.getYearsSignal ? widget.getYearsSignal() : [];
        const domains = widget.getDomainsSignal ? widget.getDomainsSignal() : [];

        const dialogRef = this.dialog.open(FilterModal, {
            width: '400px',
            data: {
                title: widget.label,
                filterFields: widget.filterFields,
                availableYears: years,
                availableDomains: domains,
                currentFilters
            }
        });

        return dialogRef.afterClosed();
        
    }


}
